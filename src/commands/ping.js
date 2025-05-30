const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with bot latency'),
  
  async execute(interaction) {
    const sent = await interaction.deferReply({ ephemeral: false, fetchReply: true });
    const pingLatency = sent.createdTimestamp - interaction.createdTimestamp;
    
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Bot Latency', value: `${pingLatency}ms`, inline: true },
        { name: 'API Latency', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'RT25K Bot', iconURL: interaction.client.user?.displayAvatarURL() });
    
    await interaction.editReply({ embeds: [embed] });
  },
};
