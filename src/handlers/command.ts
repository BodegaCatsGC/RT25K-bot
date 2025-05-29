import { Client, Collection } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import AsciiTable from 'ascii-table';

// Define the Command interface
export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  category?: string;
  cooldown?: number;
  execute: (...args: any[]) => Promise<any> | any;
}

export default (client: Client): void => {
  try {
    // Create a new ASCII table for commands
    const table = new AsciiTable('Commands');
    table.setHeading('Command', 'Load status');
    
    console.log('Welcome to COMMAND HANDLER - TypeScript Edition');
    
    // Read all directories in the commands folder
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
      // Read all command files in each folder
      const commandFiles = fs.readdirSync(path.join(commandsPath, folder))
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, folder, file);
        const command = require(filePath);
        
        // Check if the command has a name property
        if (command.default && command.default.name) {
          // Use default export if available (TypeScript module)
          const cmd = command.default;
          client.commands.set(cmd.name, cmd);
          table.addRow(file, 'Ready');
          
          // Set aliases if they exist
          if (cmd.aliases && Array.isArray(cmd.aliases)) {
            cmd.aliases.forEach((alias: string) => client.aliases.set(alias, cmd.name));
          }
        } else if (command.name) {
          // Use CommonJS style export
          client.commands.set(command.name, command);
          table.addRow(file, 'Ready');
          
          // Set aliases if they exist
          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach((alias: string) => client.aliases.set(alias, command.name));
          }
        } else {
          table.addRow(file, 'error->missing a name, or name is not a string.');
        }
      }
    }
    
    console.log(table.toString());
  } catch (error) {
    console.error(`Error in command handler: ${error}`);
  }
};
