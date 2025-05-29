import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays information about the server'),
  
  async execute(interaction: CommandInteraction) {
    const { guild } = interaction;
    
    if (!guild) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true
      });
    }
    
    // Fetch more guild data if needed
    const fullGuild = await guild.fetch();
    
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`${guild.name} Server Information`)
      .setThumbnail(guild.iconURL() || '')
      .addFields(
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: 'Boost Level', value: `${guild.premiumTier}`, inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: interaction.client.user?.displayAvatarURL() });
    
    return interaction.reply({ embeds: [embed] });
  },
};
