// src/main.ts - Main entry point for the RT25K Discord Bot

// Load environment variables first
import 'dotenv/config';

// Core dependencies
import { Client, GatewayIntentBits, Collection, Events, ActivityType } from 'discord.js';
import { createLogger, format, transports } from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import cors from 'cors';
import { registerCommands } from './utils/registerCommands';

// Setup logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new transports.Console()],
});

// Creating the Discord.js Client with modern intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Client variables to use everywhere
client.commands = new Collection();

// Load slash commands
const commandsPath = path.join(__dirname, 'commands');

// Check if the commands directory exists
if (!fs.existsSync(commandsPath)) {
  logger.error(`Commands directory not found at ${commandsPath}`);
  process.exit(1);
}

// Get all command files
const commandFiles = fs.readdirSync(commandsPath).filter(file => 
  file.endsWith('.js') || file.endsWith('.ts')
);

for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default;
    
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

// Handle interactions (slash commands)
client.on(Events.InteractionCreate, async interaction => {
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

// Ready event
client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`\n` +
    `==========================================\n` +
    `✅ ${readyClient.user.tag} is online!\n` +
    `✅ Ready to serve in ${readyClient.guilds.cache.size} servers\n` +
    `✅ Bot is ready to use!\n` +
    `==========================================`
  );
  
  // Set the bot's activity
  readyClient.user.setActivity('RT25K', { type: ActivityType.Watching });
  
  // Register slash commands
  try {
    await registerCommands();
    logger.info('Successfully registered application commands.');
  } catch (error) {
    logger.error('Failed to register application commands:', error);
  }
});

// Error handling
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Login to Discord with the token
client.login(process.env.DISCORD_TOKEN);

// Extend the Client class to include our custom properties
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}
