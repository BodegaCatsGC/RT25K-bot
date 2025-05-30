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
      let filteredStandings = standings;

      if (teamFilter) {
        filteredStandings = standings.filter(team => team.team && team.team.toLowerCase().includes(teamFilter.toLowerCase()));
      }

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

      const MAX_FIELD_LENGTH = 1024;
      const header = '```\n#  Team                 Pts\n---------------------------\n';
      const footer = '```';
      let currentStandingsText = header;
      let fieldCount = 0;

      for (let i = 0; i < filteredStandings.length; i++) {
        const team = filteredStandings[i];
        const teamNameString = team.team || 'N/A';
        const teamName = teamNameString.length > 15 ? teamNameString.substring(0, 12) + '...' : teamNameString.padEnd(15);
        const teamLine = `${String(team.position || team.rank || i + 1).padEnd(2)} ${teamName} ${String(team.totalPoints || 0).padStart(3)}\n`;

        if (currentStandingsText.length + teamLine.length + footer.length > MAX_FIELD_LENGTH) {
          currentStandingsText += footer;
          embed.addFields({
            name: fieldCount === 0 ? 'Standings' : 'Standings (cont.)',
            value: currentStandingsText,
            inline: false
          });
          currentStandingsText = header;
          fieldCount++;
        }
        currentStandingsText += teamLine;
      }

      // Add any remaining standings text
      if (currentStandingsText.length > header.length) {
        currentStandingsText += footer;
        embed.addFields({
          name: fieldCount === 0 ? 'Standings' : 'Standings (cont.)',
          value: currentStandingsText,
          inline: false
        });
      }

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
