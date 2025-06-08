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
          try {
            // Group matches by team
            const teamMatches = {};
            
            // First, validate all match data and group by team
            for (const match of simulatedMatches) {
              if (!match || !match.team1 || !match.team2 || match.score1 === undefined || match.score2 === undefined) {
                console.error('Invalid match data:', JSON.stringify(match, null, 2));
                throw new Error('Invalid match data received from simulation');
              }
              
              // Add to team1's matches
              if (!teamMatches[match.team1]) teamMatches[match.team1] = [];
              teamMatches[match.team1].push({
                opponent: match.team2,
                score1: match.score1,
                score2: match.score2,
                points: match.team1Points,
                isSweep: match.isSweep
              });
              
              // Add to team2's matches
              if (!teamMatches[match.team2]) teamMatches[match.team2] = [];
              teamMatches[match.team2].push({
                opponent: match.team1,
                score1: match.score2,
                score2: match.score1,
                points: match.team2Points,
                isSweep: match.isSweep && match.score2 === 0
              });
            }

            
            // Sort teams alphabetically
            const sortedTeams = Object.keys(teamMatches).sort();
            
            // Process each team's matches
            for (const team of sortedTeams) {
              const teamMatchList = teamMatches[team];
              let teamText = '';
              let totalPoints = 0;
              
              // Sort matches by opponent name for consistency
              teamMatchList.sort((a, b) => a.opponent.localeCompare(b.opponent));
              
              // Format each match for this team
              for (const match of teamMatchList) {
                const scoreText = `vs ${match.opponent}: ${match.score1}-${match.score2}`;
                const pointsText = `(${match.points} pts)`;
                const sweepText = match.isSweep ? '🔥 ' : '';
                teamText += `${sweepText}${scoreText} ${pointsText}\n`;
                totalPoints += match.points || 0;
              }
              
              // Add team's matches to embed
              if (teamText.length > 0) {
                // Add total points for the team
                const teamHeader = `**${team}** (${totalPoints} total points):`;
                teamText = `${teamHeader}\n${teamText}`;
                
                // Split if too long for a single field
                if (teamText.length > 1000) {
                  const half = Math.ceil(teamMatchList.length / 2);
                  const firstHalf = teamMatchList.slice(0, half);
                  const secondHalf = teamMatchList.slice(half);
                  
                  // Process first half
                  let firstHalfText = `${teamHeader}\n`;
                  firstHalfText += firstHalf.map(m => 
                    `${m.isSweep ? '🔥 ' : ''}vs ${m.opponent}: ${m.score1}-${m.score2} (${m.points} pts)`
                  ).join('\n');
                  
                  // Process second half
                  let secondHalfText = '';
                  secondHalfText += secondHalf.map(m => 
                    `${m.isSweep ? '🔥 ' : ''}vs ${m.opponent}: ${m.score1}-${m.score2} (${m.points} pts)`
                  ).join('\n');
                  
                  // Add both halves as separate fields
                  embed.addFields(
                    { name: `${team} (Part 1)`, value: firstHalfText, inline: false },
                    { name: `${team} (Part 2)`, value: secondHalfText, inline: false }
                  );
                } else {
                  embed.addFields({
                    name: team,
                    value: teamText,
                    inline: false
                  });
                }
              }
            }


            // Calculate total points earned in simulation for each team
            const pointsEarned = {};
            
            // Initialize all teams with 0 points earned
            for (const team of standings) {
              if (team?.team) {
                pointsEarned[team.team] = 0;
              }
            }
            
            // Calculate points from simulated matches
            for (const match of simulatedMatches) {
              if (!match.team1 || !match.team2) continue;
              pointsEarned[match.team1] = (pointsEarned[match.team1] || 0) + (match.team1Points || 0);
              pointsEarned[match.team2] = (pointsEarned[match.team2] || 0) + (match.team2Points || 0);
            }
            
            // Create a list of teams that earned points in the simulation
            const teamsWithPoints = Object.entries(pointsEarned)
              .filter(([_, points]) => points > 0)
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
            
            if (teamsWithPoints.length > 0) {
              const pointsList = teamsWithPoints
                .map(([team, points]) => `• ${team}: +${points} pts`)
                .join('\n');
                
              try {
                embed.addFields({
                  name: 'Points Earned in Simulation',
                  value: pointsList,
                  inline: false
                });
              } catch (err) {
                console.error('Error adding points field:', err);
                // Continue without points if we can't add them
              }
            }
          } catch (error) {
            console.error('Error processing simulation results:', error);
            throw new Error(`Error processing simulation results: ${error.message}`);
          }
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
