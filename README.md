# RT25K Discord Bot

A Discord bot for RT25K with TypeScript support and Discord Activity app integration.

## Features

- Modern Discord.js v14 implementation
- Full TypeScript support
- Command and event handler system
- Support for both prefix commands and slash commands
- Express server for Discord Activity app integration
- Logging with Winston

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to `.env` and fill in your Discord bot token and client ID:
   ```bash
   cp .env.example .env
   ```
4. Build the TypeScript code:
   ```bash
   npm run build
   ```
5. Start the bot:
   ```bash
   npm start
   ```

## Development

To run the bot in development mode with automatic reloading:

```bash
npm run dev
```

## Project Structure

- `src/` - TypeScript source code
  - `main.ts` - Main entry point
  - `commands/` - Bot commands
    - `info/` - Information commands
    - `slash/` - Slash commands
  - `events/` - Event handlers
    - `client/` - Client events
    - `guild/` - Guild events
  - `handlers/` - Command and event handlers
  - `config/` - Bot configuration
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
- `dist/` - Compiled JavaScript code
- `public/` - Static files for the Express server

## Adding Commands

### Prefix Commands

Create a new file in the `src/commands/category/` directory with the following structure:

```typescript
import { Message, Client } from 'discord.js';

export default {
  name: 'commandname',
  aliases: ['alias1', 'alias2'],
  category: 'category',
  description: 'Command description',
  usage: '[arguments]',
  cooldown: 5,
  execute(client, message, args) {
    // Command code here
  },
};
```

### Slash Commands

Create a new file in the `src/commands/slash/` directory with the following structure:

```typescript
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description'),
  async execute(interaction: CommandInteraction) {
    // Command code here
  },
};
```

## Adding Events

Create a new file in the `src/events/category/` directory with the following structure:

```typescript
import { Client } from 'discord.js';

export default {
  name: 'eventname',
  once: false, // true if the event should only be triggered once
  execute(client: Client, ...args) {
    // Event code here
  },
};
```

## License

ISC
