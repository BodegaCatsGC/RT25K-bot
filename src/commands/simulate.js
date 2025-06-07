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
    .setDescription('Simulate the remaining matches and show projected results'),

  async execute(interaction) {
    try {
      console.log('Simulate command started');
      await interaction.deferReply();

      console.log('Fetching available sheets...');
      const sheets = await getAvailableSheets();
      
      // Filter to only include allowed teams that exist in the sheets
      const teamSheets = ALLOWED_TEAMS
        .map(teamName => sheets.find(sheet => sheet.title === teamName))
        .filter(Boolean);

      console.log('Allowed team sheets found:', teamSheets.map(s => s.title));

      if (teamSheets.length === 0) {
        console.log('No allowed team sheets found');
        return interaction.editReply('❌ No valid team sheets found in the spreadsheet.');
      }

      console.log('Fetching standings...');
      const standings = await getStandings();
      console.log('Standings loaded, count:', standings?.length);
      
      if (!standings || standings.length === 0) {
        console.log('No standings data');
        return interaction.editReply('❌ Could not load team standings.');
      }

      // Get all matches from allowed team schedules
      console.log('Fetching team schedules...');
      let allMatches = [];
      const processedMatches = new Set();
      
      for (const sheet of teamSheets) {
        try {
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
        console.log('Standings data:', JSON.stringify(standings, null, 2));
        console.log('Matches data:', JSON.stringify(allMatches.slice(0, 2), null, 2)); // Log first 2 matches
        
        const simulator = new RT25KSimulator(standings, allMatches);
        
        console.log('Running simulation...');
        const result = simulator.simulateRemainingMatches();
        console.log('Simulation result:', JSON.stringify({
          standings: result.standings ? '[...]' : 'undefined',
          simulatedMatches: result.simulatedMatches ? `[${result.simulatedMatches.length} matches]` : 'undefined'
        }, null, 2));
        
        const { standings: finalStandings, simulatedMatches } = result;
        
        // Create and send the embed
        const embed = new EmbedBuilder()
          .setTitle('🎮 Simulated Match Results')
          .setColor('#0099ff')
          .setDescription('Results of simulated remaining matches:')
          .setTimestamp();

        if (simulatedMatches.length > 0) {
          const matchResults = simulatedMatches.map(match => 
            `**${match.team1}** ${match.score1}-${match.score2} **${match.team2}**`
          ).join('\n');
          
          embed.addFields({
            name: 'Simulated Matches',
            value: matchResults || 'No matches needed simulation',
            inline: false
          });

          // Add a summary of the top teams with current and simulated points
          const topTeams = [];
          for (const [group, teams] of Object.entries(finalStandings)) {
            // Get the top 3 teams in this group
            const top3 = teams.slice(0, 3);
            
            // Create a formatted string for each team showing current and simulated points
            const teamStrings = top3.map((team, index) => {
              // Find the original team data to get current points
              const originalTeam = standings.find(t => t.team === team.team);
              const currentPoints = originalTeam?.total_points || 0;
              const pointsGained = team.points - currentPoints;
              
              return `${index + 1}. ${team.team} (${currentPoints} + ${pointsGained} = ${team.points} pts)`;
            });
            
            topTeams.push(`**${group}**: ${teamStrings.join(', ')}`);
          }

          embed.addFields({
            name: 'Projected Group Leaders',
            value: topTeams.join('\n') || 'No standings available',
            inline: false
          });
        } else {
          embed.setDescription('No remaining matches to simulate!');
        }

        console.log('Sending response...');
        await interaction.editReply({ embeds: [embed] });
        console.log('Response sent successfully');

      } catch (simError) {
        console.error('Error during simulation:', simError);
        throw new Error(`Simulation error: ${simError.message}`);
      }

    } catch (error) {
      console.error('Error in simulate command:', error);
      await interaction.editReply({
        content: `❌ An error occurred: ${error.message || 'Unknown error'}`,
        ephemeral: true
      });
    }
  }
};
