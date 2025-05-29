import { Client } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import AsciiTable from 'ascii-table';
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

export default async (client: Client): Promise<void> => {
  try {
    const table = new AsciiTable('Events');
    table.setHeading('Events', 'Load status');
    const allEvents: string[] = [];

    const loadDir = async (dir: string): Promise<void> => {
      const eventsPath = path.join(__dirname, '..', 'events', dir);
      const eventFiles = fs.readdirSync(eventsPath).filter(file => 
        file.endsWith('.ts') || file.endsWith('.js')
      );

      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, dir, file);
        const event = require(filePath);
        
        // Handle both default exports (TypeScript) and regular exports (CommonJS)
        const eventModule = event.default || event;
        
        const eventName = file.split('.')[0];
        allEvents.push(eventName);

        // Bind the event
        if (eventModule.once) {
          client.once(eventName, (...args) => eventModule.execute(client, ...args));
        } else {
          client.on(eventName, (...args) => eventModule.execute(client, ...args));
        }
      }
    };

    // Load events from client and guild directories
    await Promise.all(['client', 'guild'].map(dir => loadDir(dir)));

    // Add all events to the table
    for (const eventName of allEvents) {
      try {
        table.addRow(eventName, 'Ready');
      } catch (error) {
        logger.error(`Error adding event ${eventName} to table: ${error}`);
      }
    }

    logger.info(table.toString());
    logger.info('\n' +
      '==========================================\n' +
      '✅ Events loaded successfully!\n' +
      '==========================================\n'
    );
  } catch (error) {
    logger.error(`Error in events handler: ${error}`);
  }
};
