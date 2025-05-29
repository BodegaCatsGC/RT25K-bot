import { Collection, Client } from 'discord.js';

// Command interface for command structure
export interface Command {
  name: string;
  aliases?: string[];
  category: string;
  description: string;
  usage?: string;
  cooldown?: number;
  execute: (...args: any[]) => Promise<any> | any;
}

// Event interface for event structure
export interface Event {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<any> | any;
}

// Extend the Discord.js Client interface
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}
