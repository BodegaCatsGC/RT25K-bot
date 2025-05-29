import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  ChatInputCommandInteraction, 
  EmbedBuilder as DiscordEmbedBuilder, 
  GuildMember, 
  User,
  Role
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to get information about')
        .setRequired(false)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    // Get the target user (either the mentioned user or the command user)
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild?.members.cache.get(targetUser.id);
    
    const embed = new DiscordEmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`User Information: ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'User ID', value: targetUser.id, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: interaction.client.user?.displayAvatarURL() });
    
    // Add guild-specific information if in a guild and the user is a member
    if (member) {
      // Add the join date
      embed.addFields(
        { name: 'Joined Server', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
        { name: 'Nickname', value: member.nickname || 'None', inline: true },
        { name: 'Highest Role', value: member.roles.highest.toString(), inline: true },
        { name: 'Roles', value: member.roles.cache.size > 1 ? 
          member.roles.cache
            .filter((role: Role) => role.id !== interaction.guild?.id) // Filter out @everyone role
            .sort((a: Role, b: Role) => b.position - a.position) // Sort by position
            .map((role: Role) => role.toString())
            .join(', ').substring(0, 1024) || 'None' : 'None', inline: false }
      );
    }
    
    return interaction.reply({ embeds: [embed] });
  },
};
