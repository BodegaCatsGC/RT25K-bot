import { Message, Client, Collection } from 'discord.js';
import config from '../../config/config';
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
  name: 'messageCreate', // Updated to Discord.js v14 event name
  execute(client: Client, message: Message) {
    // Ignore messages from bots or without the prefix
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    // Extract command name and arguments
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    // Find command by name or alias
    const command = client.commands.get(commandName) || 
                    client.commands.get(client.aliases.get(commandName) || '');

    if (!command) return;

    // Handle command cooldowns
    if (!client.cooldowns.has(command.name)) {
      client.cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || config.defaultCommandCooldown) * 1000;

    if (timestamps?.has(message.author.id)) {
      const expirationTime = (timestamps.get(message.author.id) || 0) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(
          `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
        );
      }
    }

    timestamps?.set(message.author.id, now);
    setTimeout(() => timestamps?.delete(message.author.id), cooldownAmount);

    // Execute the command
    try {
      command.execute(client, message, args);
    } catch (error) {
      logger.error(`Error executing command ${commandName}:`, error);
      message.reply('There was an error trying to execute that command!');
    }
  },
};
