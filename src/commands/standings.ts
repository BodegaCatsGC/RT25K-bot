import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Displays RT25K standings')
    .addStringOption(option => 
      option.setName('team')
        .setDescription('Filter standings by team name')
        .setRequired(false)),
  
  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    
    try {
      // In a real implementation, you would fetch data from your Google Sheets or database
      // For now, we'll use placeholder data
      const standings = [
        { rank: 1, team: 'Team A', points: 250, wins: 10, losses: 2 },
        { rank: 2, team: 'Team B', points: 225, wins: 9, losses: 3 },
        { rank: 3, team: 'Team C', points: 200, wins: 8, losses: 4 },
        { rank: 4, team: 'Team D', points: 175, wins: 7, losses: 5 },
        { rank: 5, team: 'Team E', points: 150, wins: 6, losses: 6 },
      ];
      
      // Check if filtering by team name
      const teamFilter = interaction.options.get('team')?.value as string | undefined;
      let filteredStandings = standings;
      
      if (teamFilter) {
        const lowerCaseFilter = teamFilter.toLowerCase();
        filteredStandings = standings.filter(team => 
          team.team.toLowerCase().includes(lowerCaseFilter)
        );
        
        if (filteredStandings.length === 0) {
          return interaction.editReply(`No teams found matching "${teamFilter}".`);
        }
      }
      
      // Create embed for standings
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('RT25K Standings')
        .setDescription('Current standings for the Road to 25K competition')
        .setTimestamp()
        .setFooter({ text: 'RT25K Bot', iconURL: interaction.client.user?.displayAvatarURL() });
      
      // Add standings data to the embed
      let standingsText = '';
      
      filteredStandings.forEach(team => {
        standingsText += `**${team.rank}. ${team.team}** - ${team.points} points (${team.wins}W-${team.losses}L)\n`;
      });
      
      embed.addFields({ name: 'Rankings', value: standingsText || 'No standings data available.' });
      
      // Add a button to open the full standings in the Activity app
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('open_activity')
            .setLabel('Open Full Standings')
            .setStyle(ButtonStyle.Primary)
        );
      
      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });
    } catch (error) {
      console.error('Error fetching standings:', error);
      await interaction.editReply('There was an error fetching the standings. Please try again later.');
    }
  },
};
