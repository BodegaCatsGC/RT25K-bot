// src/commands/simulate.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStandings, getAvailableSheets, getSchedule } = require('../utils/googleSheets');
const { RT25KSimulator } = require('../utils/simulation');

// List of allowed team sheets
const ALLOWED_TEAMS = [
  'Achieve Greatness',
  'Bodega Cats',
  'On Site',
  'High Octane',
  'Zero Tolerance',
  'Zero Gaming',
  'Before The Fame',
  'Coatesville',
  'Lights Out',
  'Liquid Pro Am',
  'Hitlist',
  'Nobody Plays Harder'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simulate')
    .setDescription('Simulate the remaining matches and show projected results')
    .addStringOption(option =>
      option.setName('team')
        .setDescription('Filter results by team (optional)')
        .setRequired(false)
        .setAutocomplete(true)),

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      console.log(`Autocomplete triggered for team: ${focusedValue}`);
      
      // Filter and sort the teams based on the focused value
      const filtered = ALLOWED_TEAMS
        .filter(team => team.toLowerCase().includes(focusedValue))
        .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
        .slice(0, 25); // Discord limit for autocomplete options
      
      console.log(`Sending ${filtered.length} autocomplete options`);
      
      await interaction.respond(
        filtered.map(team => ({
          name: team,
          value: team
        }))
      );
    } catch (error) {
      console.error('Error in autocomplete:', error);
      // Send an empty array to prevent unhandled interaction errors
      if (!interaction.responded) {
        await interaction.respond([]).catch(console.error);
      }
    }
  },

  async execute(interaction) {
    try {
      console.log('Simulate command started');
      await interaction.deferReply();

      const teamFilter = interaction.options.getString('team');
      
      // Get standings with games played
      console.log('Fetching standings...');
      const standings = await getStandings();
      console.log('Standings loaded, count:', standings?.length);
      
      if (!standings || standings.length === 0) {
        console.log('No standings data');
        return interaction.editReply('❌ Could not load team standings.');
      }

      // Log sample standings data for debugging
      console.log('Sample standings data:', standings.slice(0, 3).map(s => ({
        team: s.team,
        gamesPlayed: s.gamesPlayed,
        totalPoints: s.totalPoints
      })));

      // Process team sheets to get matches
      console.log('Processing team sheets...');
      const sheets = await getAvailableSheets();
      
      // Filter to only include allowed teams that exist in the sheets
      const teamSheets = ALLOWED_TEAMS
        .map(teamName => sheets.find(sheet => sheet.title === teamName))
        .filter(Boolean);

      console.log('Allowed team sheets found:', teamSheets.map(s => s.title));

      if (teamSheets.length === 0) {
        console.log('No team sheets found');
        return interaction.editReply('❌ No team sheets found.');
      }

      console.log('Fetching team schedules...');
      let allMatches = [];
      const processedMatches = new Set();
      
      for (const sheet of teamSheets) {
        try {
          // If team filter is set, only process that team's schedule
          if (teamFilter && sheet.title !== teamFilter) {
            continue;
          }
          
          console.log(`Processing sheet: ${sheet.title}`);
          const teamSchedule = await getSchedule({ sheetName: sheet.title });
          console.log(`Found ${teamSchedule.length} matches in ${sheet.title}`);
          
          for (const match of teamSchedule) {
            if (!match.homeTeam || !match.awayTeam) {
              console.log('Skipping match with missing team data:', match);
              continue;
            }
            
            // Only include matches where both teams are in the allowed list
            if (ALLOWED_TEAMS.includes(match.homeTeam) && ALLOWED_TEAMS.includes(match.awayTeam)) {
              const key = [match.homeTeam, match.awayTeam].sort().join('_');
              if (!processedMatches.has(key)) {
                allMatches.push(match);
                processedMatches.add(key);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing sheet ${sheet.title}:`, error);
        }
      }

      console.log(`Total unique matches found: ${allMatches.length}`);
      
      if (allMatches.length === 0) {
        console.log('No matches found in any team schedule');
        return interaction.editReply('❌ No matches found in team schedules.');
      }

      try {
        console.log('Initializing simulator...');
        const simulator = new RT25KSimulator(standings, allMatches);
        
        console.log('Running 3 simulations to get average results...');
        const simulationRuns = 3;
        let allSimulatedMatches = [];
        let allFinalStandings = [];
        
        // Run simulation multiple times
        for (let i = 0; i < simulationRuns; i++) {
          console.log(`Running simulation ${i + 1}/${simulationRuns}...`);
          const result = simulator.simulateRemainingMatches();
          allSimulatedMatches.push(...result.simulatedMatches);
          allFinalStandings.push(result.standings);
        }
        
        // Process and average the results
        const matchResults = {};
        
        // Aggregate match results
        allSimulatedMatches.forEach(match => {
          const key = `${match.team1} vs ${match.team2}`;
          if (!matchResults[key]) {
            matchResults[key] = {
              team1: match.team1,
              team2: match.team2,
              team1Wins: 0,
              team2Wins: 0,
              totalSimulations: 0
            };
          }
          
          if (match.score1 > match.score2) {
            matchResults[key].team1Wins++;
          } else {
            matchResults[key].team2Wins++;
          }
          matchResults[key].totalSimulations++;
        });
        
        // Convert to array and calculate win percentages
        const simulatedMatches = Object.values(matchResults).map(match => ({
          team1: match.team1,
          team2: match.team2,
          team1WinPct: Math.round((match.team1Wins / match.totalSimulations) * 100),
          team2WinPct: Math.round((match.team2Wins / match.totalSimulations) * 100),
          isSimulated: true
        }));
        
        // Sort matches by team1 name for consistent display
        simulatedMatches.sort((a, b) => a.team1.localeCompare(b.team1));
        
        // Generate result message with team power and activity info
        let resultMessage = `**Simulation Results (${simulationRuns} runs)**\n\n`;
        
        // Add match predictions
        resultMessage += '**Match Predictions:**\n';
        simulatedMatches.forEach(match => {
          resultMessage += `• **${match.team1}** ${match.team1WinPct}% - ${match.team2WinPct}% **${match.team2}**\n`;
        });
        
        // Add team power and activity info
        resultMessage += '\n**Team Power and Activity:**\n';
        const teamInfo = [];
        
        // Get unique teams and their info
        const allTeams = new Set();
        simulatedMatches.forEach(match => {
          allTeams.add(match.team1);
          allTeams.add(match.team2);
        });
        
        // Get power and activity for each team
        for (const teamName of allTeams) {
          try {
            if (!teamName) continue;
            
            const powerInfo = simulator.getAdjustedPower(teamName);
            const teamData = simulator.teamData?.[teamName] || { power: 0, activity: 'inactive', gamesPlayed: 0 };
            const gamesPlayed = teamData.gamesPlayed || 0;
            const activityStatus = this.getActivityLevel(teamName);
            const activityMultiplier = (1 + 0.2 * (Math.min(gamesPlayed / 5, 1.0))).toFixed(2);
            
            teamInfo.push({
              name: teamName,
              power: (teamData.power || 0).toFixed(2),
              activity: activityStatus,
              games: gamesPlayed,
              status: activityStatus,
              multiplier: activityMultiplier,
              finalPower: (powerInfo?.finalPower || 0).toFixed(2)
            });
          } catch (error) {
            console.error(`Error processing team ${teamName}:`, error);
          }
        }
        
        // Sort by final power
        teamInfo.sort((a, b) => b.finalPower - a.finalPower);
        
        // Add team info to result
        teamInfo.forEach(team => {
          resultMessage += `\n**${team.name}**: ${team.finalPower} (base: ${team.power}, `;
          resultMessage += `activity: ${team.activity} x ${team.status} (${team.games} games) = x${team.multiplier})`;
        });
        
        // Create and send the embed
        const embed = new EmbedBuilder()
          .setTitle(teamFilter 
            ? `🎮 Simulated Match Results for ${teamFilter}` 
            : '🎮 Simulated Match Results')
          .setColor('#0099ff')
          .setDescription(resultMessage)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        
      } catch (error) {
        console.error('Error in simulation:', error);
        await interaction.editReply('❌ An error occurred during simulation. Please try again later.');
      }
      
    } catch (error) {
      console.error('Error in simulate command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply('❌ An error occurred while processing the command.');
      } else {
        await interaction.editReply('❌ An error occurred while processing the command.');
      }
    }
  }
};
