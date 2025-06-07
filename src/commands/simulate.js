// src/commands/simulate.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStandings, getSchedule } = require('../utils/googleSheets');
const { RT25KSimulator } = require('../utils/simulation');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simulate')
    .setDescription('Simulate the remaining matches and show projected standings'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Get current standings and schedule using existing utilities
      const [standings, schedule] = await Promise.all([
        getStandings(),
        getSchedule()
      ]);

      // Initialize simulator with the data
      const simulator = new RT25KSimulator(standings, schedule);
      
      // Run simulation
      const results = simulator.simulateRemainingMatches();

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('🏆 Projected Standings')
        .setColor('#0099ff')
        .setDescription('Simulation results based on current standings and team power levels')
        .setTimestamp();

      // Add a field for each group
      for (const [group, teams] of Object.entries(results)) {
        const groupStandings = teams
          .map((team, index) => 
            `**${index + 1}.** ${team.team} - ${team.points} pts ` +
            `(${team.wins}W-${team.losses}L, ${team.roundWins}-${team.roundLosses} RD)`
          )
          .join('\n');

        embed.addFields({
          name: `Group ${group}`,
          value: groupStandings,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in simulate command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while running the simulation.',
        ephemeral: true
      });
    }
  }
};
