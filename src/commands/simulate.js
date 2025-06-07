// src/commands/simulate.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStandings, getSchedule } = require('../utils/googleSheets');
const { RT25KSimulator } = require('../utils/simulation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simulate')
    .setDescription('Simulate the remaining matches and show projected results'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Get current standings and schedule using existing utilities
      const [standings, schedule] = await Promise.all([
        getStandings(),
        getSchedule()
      ]);

      // Check if we have data
      if (!standings || standings.length === 0) {
        return interaction.editReply('❌ Could not load team standings.');
      }
      if (!schedule || schedule.length === 0) {
        return interaction.editReply('❌ Could not load match schedule.');
      }

      // Initialize simulator with the data
      const simulator = new RT25KSimulator(standings, schedule);
      
      // Run simulation
      const { standings: finalStandings, simulatedMatches } = simulator.simulateRemainingMatches();

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('� Simulated Match Results')
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
        content: '❌ An error occurred while running the simulation. Check the console for details.',
        ephemeral: true
      });
    }
  }
};
