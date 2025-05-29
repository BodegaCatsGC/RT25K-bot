import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, format, transports } from 'winston';

// Setup logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
  ),
  transports: [new transports.Console()],
});

export async function registerCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  try {
    // Check if the commands directory exists
    if (!fs.existsSync(commandsPath)) {
      logger.error(`Commands directory not found at ${commandsPath}`);
      return;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => 
      file.endsWith('.js')
    );

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      
      try {
        const command = require(filePath).default;
        
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
          logger.info(`Registered slash command: ${command.data.name}`);
        } else {
          logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      } catch (error) {
        logger.error(`Error loading command from ${filePath}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error reading commands directory:', error);
    return;
  }

  if (commands.length === 0) {
    logger.warn('No commands found to register.');
    return;
  }

  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  
  if (!token) {
    logger.error('DISCORD_TOKEN is not defined in environment variables. Cannot register slash commands.');
    return;
  }
  
  if (!clientId) {
    logger.error('CLIENT_ID is not defined in environment variables. Cannot register slash commands.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    logger.info(`Successfully reloaded ${Array.isArray(data) ? data.length : 0} application (/) commands.`);
  } catch (error) {
    logger.error('Failed to reload application (/) commands:', error);
  }
}
