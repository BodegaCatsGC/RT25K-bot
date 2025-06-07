// src/commands/simulate.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStandings, getAvailableSheets, getSchedule } = require('../utils/googleSheets');
const { RT25KSimulator } = require('../utils/simulation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simulate')
    .setDescription('Simulate the remaining matches and show projected results'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Get available sheets to find team schedules
      const sheets = await getAvailableSheets();
      const teamSheets = sheets
        .filter(sheet => !['standings', 'schedule', 'overall', 'template'].includes(sheet.title.toLowerCase()));

      if (teamSheets.length === 0) {
        return interaction.editReply('❌ No team sheets found in the spreadsheet.');
      }

      // Get standings
      const standings = await getStandings();
      if (!standings || standings.length === 0) {
        return interaction.editReply('❌ Could not load team standings.');
      }

      // Get all matches from all team schedules
      let allMatches = [];
      const processedMatches = new Set();
      
      for (const sheet of teamSheets) {
        try {
          const teamSchedule = await getSchedule({ sheetName: sheet.title });
          
          // Filter out duplicates by creating a unique match key
          for (const match of teamSchedule) {
            const key = [match.homeTeam, match.awayTeam].sort().join('_');
            if (!processedMatches.has(key)) {
              allMatches.push(match);
              processedMatches.add(key);
            }
          }
        } catch (error) {
          console.error(`Error processing sheet ${sheet.title}:`, error);
          // Continue with other sheets even if one fails
        }
      }

      if (allMatches.length === 0) {
        return interaction.editReply('❌ No matches found in team schedules.');
      }

      console.log(`Found ${allMatches.length} unique matches across all team schedules`);

      // Initialize simulator with the data
      const simulator = new RT25KSimulator(standings, allMatches);
      
      // Run simulation
      const { standings: finalStandings, simulatedMatches } = simulator.simulateRemainingMatches();

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(' Simulated Match Results')
        .setColor('#0099ff')
        .setDescription('Results of simulated remaining matches:')
        .setTimestamp();

      // Add simulated matches to the embed
      if (simulatedMatches.length > 0) {
        const matchResults = simulatedMatches.map((match, index) => 
          `**${match.team1}** ${match.score1}-${match.score2} **${match.team2}**`
        ).join('\n');
        
        embed.addFields({
          name: 'Simulated Matches',
          value: matchResults || 'No matches needed simulation',
          inline: false
        });

        // Add a summary of the top teams
        const topTeams = [];
        for (const [group, teams] of Object.entries(finalStandings)) {
          const top3 = teams.slice(0, 3);
          topTeams.push(
            `**${group}**: ` +
            top3.map((t, i) => `${i + 1}. ${t.team} (${t.points} pts)`).join(', ')
          );
        }

        embed.addFields({
          name: 'Projected Group Leaders',
          value: topTeams.join('\n') || 'No standings available',
          inline: false
        });
      } else {
        embed.setDescription('No remaining matches to simulate!');
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in simulate command:', error);
      await interaction.editReply({
        content: ' An error occurred while running the simulation. Check the console for details.',
        ephemeral: true
      });
    }
  }
};
