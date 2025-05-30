const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays information about the server'),
  
  async execute(interaction) {
    const { guild } = interaction;
    
    if (!guild) {
      return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }
    
    // Get guild information
    const roles = guild.roles.cache.size;
    const emojis = guild.emojis.cache.size;
    const channels = guild.channels.cache.size;
    const members = guild.memberCount;
    
    // Calculate online members
    const onlineMembers = guild.members.cache.filter(member => 
      member.presence?.status === 'online' || 
      member.presence?.status === 'idle' || 
      member.presence?.status === 'dnd'
    ).size;
    
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`Server Information: ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Members', value: `${members} (${onlineMembers} online)`, inline: true },
        { name: 'Channels', value: `${channels}`, inline: true },
        { name: 'Roles', value: `${roles}`, inline: true },
        { name: 'Emojis', value: `${emojis}`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true },
        { name: 'Boost Count', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: interaction.client.user?.displayAvatarURL() });
    
    return interaction.reply({ embeds: [embed] });
  },
};
