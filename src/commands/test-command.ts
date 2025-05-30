import { SlashCommandBuilder } from '@discordjs/builders';
import { 
  ChatInputCommandInteraction,
  EmbedBuilder,
  Client
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('A test command to verify Discord.js types'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Test Command')
      .setDescription('This command works correctly!')
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: interaction.client.user?.displayAvatarURL() });
    
    return interaction.reply({ embeds: [embed] });
  },
};
