const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Displays RT25K standings')
    .addStringOption(option =>
      option.setName('team')
        .setDescription('Filter standings by team name')
        .setRequired(false)),
  
  async execute(interaction) {
    // Mock data - in a real implementation, this would come from Google Sheets
    const standings = [
      { rank: 1, team: 'Team A', points: 250, wins: 10, losses: 2 },
      { rank: 2, team: 'Team B', points: 225, wins: 9, losses: 3 },
      { rank: 3, team: 'Team C', points: 200, wins: 8, losses: 4 },
      { rank: 4, team: 'Team D', points: 175, wins: 7, losses: 5 },
      { rank: 5, team: 'Team E', points: 150, wins: 6, losses: 6 },
    ];
    
    // Get team filter if provided
    const teamFilter = interaction.options.getString('team');
    
    // Filter standings if team name is provided
    const filteredStandings = teamFilter
      ? standings.filter(team => team.team.toLowerCase().includes(teamFilter.toLowerCase()))
      : standings;
    
    if (filteredStandings.length === 0) {
      return interaction.reply({ 
        content: `No teams found matching "${teamFilter}".`, 
        ephemeral: true 
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('RT25K Standings')
      .setDescription(teamFilter ? `Filtered by: ${teamFilter}` : 'Current standings')
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: interaction.client.user?.displayAvatarURL() });
    
    // Add standings data
    filteredStandings.forEach(team => {
      embed.addFields({
        name: `#${team.rank}: ${team.team}`,
        value: `Points: ${team.points} | Record: ${team.wins}-${team.losses}`,
        inline: false
      });
    });
    
    // Simply reply with the embed
    return interaction.reply({
      embeds: [embed]
    });
  },
};
