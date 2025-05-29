import { Client, ActivityType } from 'discord.js';
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

export default {
  name: 'ready',
  once: true,
  execute(client: Client) {
    logger.info(`\n` +
      `==========================================\n` +
      ` ${client.user?.tag} is online!\n` +
      ` Ready to serve in ${client.guilds.cache.size} servers\n` +
      ` Bot is ready to use!\n` +
      `==========================================`
    );
    
    // Set the bot's activity
    client.user?.setActivity('RT25K', { type: ActivityType.Watching });
  }
};
