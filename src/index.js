const { Client, Collection, GatewayIntentBits, Events, ActivityType } = require('discord.js');
const { config } = require('dotenv');
const fs = require('fs');
const path = require('path');
const { createServer } = require('node:http');
const { createLogger, format, transports } = require('winston');

// Load environment variables
config();

// Read secrets from files if they exist (Docker Swarm/Secrets)
const readSecret = (secretPath) => {
  try {
    return fs.readFileSync(secretPath, 'utf8').trim();
  } catch (error) {
    // Fallback to environment variable if secret file doesn't exist
    const envVarName = secretPath.split('/').pop().toUpperCase();
    return process.env[envVarName];
  }
};

// Load secrets with fallback to environment variables
const DISCORD_TOKEN = readSecret('/run/secrets/discord_token') || process.env.DISCORD_TOKEN;
const CLIENT_ID = readSecret('/run/secrets/client_id') || process.env.CLIENT_ID;
const APPLICATION_ID = readSecret('/run/secrets/application_id') || process.env.APPLICATION_ID;
const GOOGLE_CREDENTIALS = readSecret('/run/secrets/google_credentials') || process.env.GOOGLE_CREDENTIALS;

// Update process.env with the resolved values
if (DISCORD_TOKEN) process.env.DISCORD_TOKEN = DISCORD_TOKEN;
if (CLIENT_ID) process.env.CLIENT_ID = CLIENT_ID;
if (APPLICATION_ID) process.env.APPLICATION_ID = APPLICATION_ID;
if (GOOGLE_CREDENTIALS) process.env.GOOGLE_CREDENTIALS = GOOGLE_CREDENTIALS;

// Setup logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new transports.Console()],
});

// Simple HTTP server for health checks
const PORT = process.env.PORT || 3000;
createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT, () => {
  logger.info(`Health check server listening on port ${PORT}`);
});

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// No activity manager needed

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
  // Handle slash commands only
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

// No Express server needed for slash commands only

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
if (!process.env.DISCORD_TOKEN) {
  logger.error('No Discord token found. Please set the DISCORD_TOKEN environment variable or secret.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN)
  .catch(error => {
    logger.error('Failed to login to Discord:', error);
    process.exit(1);
  });
