import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder, Collection } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available commands')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('Get info about a specific command')
        .setRequired(false)),
  
  async execute(interaction: CommandInteraction) {
    const { client } = interaction;
    const commandName = interaction.options.get('command')?.value as string | undefined;
    
    // If a specific command is requested
    if (commandName) {
      const command = client.commands.get(commandName);
      
      if (!command) {
        return interaction.reply({
          content: `No command found with name \`${commandName}\``,
          ephemeral: true
        });
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Command: ${command.data.name}`)
        .setDescription(command.data.description)
        .setTimestamp()
        .setFooter({ text: 'RT25K Bot', iconURL: client.user?.displayAvatarURL() });
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    // If no specific command is requested, list all commands
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('RT25K Bot Commands')
      .setDescription('Here are all available commands:')
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: client.user?.displayAvatarURL() });
    
    // Group commands by category if they have categories, otherwise list all commands
    const commands = client.commands as Collection<string, { data: { name: string, description: string } }>;
    
    // Add all commands to the embed
    embed.addFields({
      name: 'Available Commands',
      value: commands.map(cmd => `\`/${cmd.data.name}\`: ${cmd.data.description}`).join('\n')
    });
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
