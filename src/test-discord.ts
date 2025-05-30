// Import necessary classes from discord.js
const { Client, GatewayIntentBits, Events, ActivityType, EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

// Create a new client instance with the necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  
  // Set the bot's activity
  readyClient.user.setActivity('RT25K', { type: ActivityType.Watching });
});

// Example slash command
const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Ping')
      .setDescription('Pong!');
      
    await interaction.reply({ embeds: [embed] });
  }
};

// Log in to Discord with your client's token
// client.login(process.env.DISCORD_TOKEN);

// Export for testing
module.exports = { client, pingCommand };
