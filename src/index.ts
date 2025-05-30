const { Client, Collection, GatewayIntentBits, Events, ActivityType } = require('discord.js');
const { config } = require('dotenv');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createLogger, format, transports } = require('winston');
const ActivityManager = require('./utils/activityManager');

// Load environment variables
config();

// Setup logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new transports.Console()],
});

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Initialize activity manager
const activityManager = new ActivityManager(process.env.ACTIVITY_ID);

// Initialize commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      logger.info(`Loaded command: ${command.data.name}`);
    } else {
      logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  } catch (error) {
    logger.error(`Error loading command from file ${file}:`, error);
  }
}

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
  // Handle button interactions for activities
  if (interaction.isButton() && interaction.customId.startsWith('activity_')) {
    try {
      await activityManager.handleActivityButtonInteraction(interaction);
      return;
    } catch (error) {
      logger.error('Error handling activity button:', error);
      return;
    }
  }

  // Handle slash commands
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Express server setup for Activity app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Start Express server
try {
  app.listen(PORT, () => {
    logger.info('\n' +
      '==========================================\n' +
      '✅ Express server is LIVE for bot interactions!\n' +
      `🌐 Server running on port ${PORT}\n` +
      '==========================================\n'
    );
  });
} catch (err) {
  logger.error('\n' +
    '==========================================\n' +
    '❌ Activity server FAILED TO START!\n' +
    '🚨 Please check configuration and logs.\n' +
    '==========================================\n'
  );
  process.exit(1);
}

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, readyClient => {
  logger.info(`\n` +
    `==========================================\n` +
    `✅ ${readyClient.user.tag} is online!\n` +
    `✅ Ready to serve in ${readyClient.guilds.cache.size} servers\n` +
    `✅ Bot is ready to use!\n` +
    `==========================================`
  );
  
  // Set the bot's activity
  readyClient.user.setActivity('RT25K', { type: ActivityType.Watching });
});

// Error handling
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
