import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    
    await interaction.editReply({
      content: `Pong! Roundtrip latency: ${ping}ms\nWebsocket heartbeat: ${interaction.client.ws.ping}ms`
    });
  },
};
