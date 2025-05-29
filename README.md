# RT25K Discord Bot

A customizable Discord bot built with Discord.js v12, featuring a modular command and event handler system.

## Features

- 🚀 Easy-to-use command handler
- ⚡ Event-driven architecture
- 🔧 Configurable prefix and command cooldowns
- 📁 Organized command categories
- 🔄 Built-in error handling

## Prerequisites

- Node.js v12.0.0 or higher
- npm (comes with Node.js)
- A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/RT25K-bot.git
   cd RT25K-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the bot:
   - Copy `botconfig/config.example.json` to `botconfig/config.json`
   - Add your Discord bot token to `botconfig/config.json`
   - Customize the prefix and command cooldown as needed

4. Start the bot:
   ```bash
   npm start
   ```

## Project Structure

```
RT25K-bot/
├── commands/           # Command categories
│   ├── Administration/
│   └── Information/
├── events/            # Event handlers
├── handlers/          # Core handlers
├── botconfig/         # Configuration files
│   ├── config.json    # Bot configuration
│   └── embed.json     # Embed message templates
├── index.js           # Main bot file
└── package.json       # Project dependencies
```

## Available Commands

### Administration
- `!ping` - Check bot's latency
- `!help` - Show help menu

### Information
- `!serverinfo` - Display server information
- `!userinfo [@user]` - Display user information
- `!botinfo` - Display bot information

## Configuration

Edit `botconfig/config.json` to customize:
- `token`: Your Discord bot token
- `prefix`: Command prefix (default: `!`)
- `defaultCommandCooldown`: Cooldown between command usage in seconds

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Submit a pull request

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Credits

- Built using [Discord.js](https://discord.js.org/)
- Template by [Tomato#6966](https://github.com/Tomato6966/Discord-Js-Handler-Template)
- Maintained by [Your Name]
