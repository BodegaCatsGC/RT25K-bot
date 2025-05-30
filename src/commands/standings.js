const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getStandings } = require('../utils/googleSheets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Displays RT25K standings')
    .addStringOption(option =>
      option.setName('team')
        .setDescription('Filter standings by team name')
        .setRequired(false)),
  
  async execute(interaction) {
    try {
      // Defer the reply to give us more time to fetch data
      await interaction.deferReply();
      
      // Fetch standings from Google Sheets
      const standings = await getStandings();
      
      // Get team filter if provided
      const teamFilter = interaction.options.getString('team');
      
      const filteredStandings = standings; // No filtering needed for now
      if (filteredStandings.length === 0) {
        return interaction.editReply({ 
          content: `No teams found matching "${teamFilter}".`
        });
      }

      // Create an embed to display the standings
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('RT25K Standings')
        .setDescription('Current season standings')
        .setTimestamp();

      // Add fields for each team
      filteredStandings.forEach(team => {
        embed.addFields({
 name: `#${team.position} - ${team.name}`,
 value: `Points: ${team.total_points}`,
          inline: false
        });
      });

      // Send the embed
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in standings command:', error);
      await interaction.editReply({
        content: 'There was an error fetching the standings. Please try again later.',
        ephemeral: true
      });
    }
  },
};
