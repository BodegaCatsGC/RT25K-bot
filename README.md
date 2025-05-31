# RT25K Discord Bot

A modern Discord bot for RT25K with Google Sheets integration for real-time standings and tournament management.

## ✨ Features

* **Modern Discord.js v14** with slash commands support
* **Google Sheets Integration** for real-time standings
* **Challonge Tournament Integration** for tournament management
* **Docker Support** for easy deployment
* **Structured Logging** with Winston
* **Environment-based Configuration** with Docker Secrets support

## 🚀 Setup

### Prerequisites

* Node.js 16.9.0 or higher (LTS recommended)
* Docker (optional, for containerized deployment)
* A Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
* Google Cloud Project with Google Sheets API enabled (for standings functionality)
* Challonge API key (optional, for tournament features)

### Local Development

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/RT25K-bot.git
   cd RT25K-bot
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   * Copy `.env.example` to `.env`
   * Fill in your configuration (see [Configuration](#-configuration) section)

4. Start the development server

   ```bash
   npm run dev
   ```

### Production

For production, it's recommended to use Docker:

```bash
docker-compose up -d
```

Or deploy with npm:

```bash
npm run build
npm start
```

## 🛠 Development

### Available Scripts

* `npm run dev` - Start development server with nodemon
* `npm start` - Start production server
* `npm run register` - Register slash commands with Discord

### Project Structure

```
src/
├── commands/       # Slash command handlers
├── events/         # Discord event handlers
├── utils/          # Utility functions
│   ├── googleSheets.js  # Google Sheets integration
│   └── logger.js        # Logging configuration
├── deploy-commands.js   # Command deployment script
└── index.js             # Main application entry point
```

## Project Structure

* `src/` - Source code

  * `commands/` - Bot slash commands
  * `events/` - Event handlers
  * `handlers/` - Command and event handlers
  * `utils/` - Utility functions including Google Sheets integration
* `service-account.json` - Google Cloud service account credentials (keep this private!)
* `.env` - Environment variables (keep this private!)

## 💻 Available Commands

### 🏆 Standings

Display the current RT25K standings from Google Sheets.

**Options:**

* `team` (Optional): Filter standings by team name (case-insensitive, partial match)

**Examples:**

```
/standings
/standings team:Bodega
```

### 🏅 Tournament

Display information about a Challonge tournament.

**Options:**

* `id` (Required): Tournament ID or URL (e.g., `my-tournament` or `mytourney123`)

**Examples:**

```
/tournament id:my-tournament
/tournament id:mytourney123
```

### 🛠 Utility Commands

* `/help` - Shows help information about available commands
* `/ping` - Check if the bot is responsive
* `/serverinfo` - Display server information
* `/userinfo [user]` - Display information about a user

### 🔄 Admin Commands

* `/register` - Register slash commands (Admin only)
* `/config` - Configure bot settings (Admin only)

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```ini
# Required
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
APPLICATION_ID=your_discord_application_id

# Google Sheets Integration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_WORKSHEET_NAME=your_worksheet_name

# Challonge Integration (Optional)
CHALLONGE_API_KEY=your_challonge_api_key

# Logging
LOG_LEVEL=info

# Docker Secrets (alternative to environment variables)
# Mount secrets at /run/secrets/
```

### Docker Secrets

For enhanced security in production, you can use Docker secrets instead of environment variables:

1. Create a Docker secret:

   ```bash
   echo "your_discord_token" | docker secret create discord_token -
   ```

2. The bot will automatically look for secrets in `/run/secrets/` with the following names:

   * `discord_token`
   * `client_id`
   * `application_id`
   * `google_credentials`

## 🔄 Challonge Integration

The bot can fetch and display tournament information from Challonge. Here's how to set it up:

1. **Get your Challonge API key**

   * Log in to your Challonge account
   * Go to [Account Settings](https://challonge.com/settings/developer)
   * Under "API Credentials", generate a new API key

2. **Configure Environment Variables**
   Add this to your `.env` file:

   ```
   CHALLONGE_API_KEY=your_challonge_api_key_here
   ```

3. **Using the Tournament Command**

   * Use the `/tournament` command with a tournament ID or URL
   * The bot will display tournament details, participants, and match information

## 📊 Google Sheets Integration

The bot can fetch and display standings data from a Google Sheet. Here's how to set it up:

1. **Set up a Google Cloud Project**

   * Go to the [Google Cloud Console](https://console.cloud.google.com/)
   * Create a new project or select an existing one
   * Enable the Google Sheets API
   * Create a service account and download the JSON key file

2. **Configure Environment Variables**
   Add these to your `.env` file:

   ```
   # Google Sheets Integration
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SHEETS_WORKSHEET_NAME=Overall Standings
   ```

   Or use Docker secrets:

   ```bash
   echo '{"type": "service_account", ...}' | docker secret create google_credentials -
   ```

3. **Share your Google Sheet**

   * Open your Google Sheet
   * Click "Share" and add your service account email as an editor

## 🐳 Docker Deployment

### Prerequisites

* Docker Engine 20.10.0+
* Docker Compose 1.29.0+

### Using Docker Compose

1. Create a `.env` file with your configuration
2. Start the services:

   ```bash
   docker-compose up -d
   ```

### Environment Variables

See the [Configuration](#-configuration) section for all available environment variables.

### Volumes

* `/app/data` - Persistent data storage
* `/app/logs` - Application logs

### Healthcheck

The container includes a healthcheck that verifies the bot is connected to Discord.

## 🛠 Adding Commands

Create a new JavaScript file in the `src/commands/` directory with the following structure:

```javascript
const { SlashCommandBuilder } = require('@discordjs/builders');
const { logger } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description')
    // Add options if needed
    .addStringOption(option =>
      option
        .setName('optionname')
        .setDescription('Option description')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // Command code here
      await interaction.reply('Command response');
    } catch (error) {
      logger.error('Error in commandname command:', error);
      if (!interaction.replied) {
        await interaction.reply({
          content: 'There was an error executing this command!',
          ephemeral: true
        });
      }
    }
  }
};
```

### Command Structure

* Each command is a module that exports a `data` property (the command definition) and an `execute` function
* The `data` property uses `SlashCommandBuilder` to define the command and its options
* The `execute` function contains the command's logic and is called when the command is used

## 🚨 Troubleshooting

### Common Issues

#### Google Sheets API Errors

* **Symptom**: "The caller does not have permission"

  * ✅ Ensure the service account email is added as an editor to the Google Sheet
  * ✅ Verify the `GOOGLE_SHEETS_SPREADSHEET_ID` is correct
  * ✅ Check that the private key is properly formatted with `\n` for newlines

#### Standings Command

* **Symptom**: No standings appear

  * ✅ Check the bot logs for error messages
  * ✅ Verify the worksheet name matches exactly (case-sensitive)
  * ✅ Ensure your Google Sheet has the required columns:

    * Column 1: Position
    * Column 2: Team Name
    * Column 3: Total Points

#### Challonge Integration

* **Symptom**: Tournament not found

  * ✅ Verify the tournament ID or URL is correct
  * ✅ Ensure the tournament is not private or password-protected
  * ✅ Check that your API key has the correct permissions

#### Docker Issues

* **Symptom**: Container exits immediately

  * ✅ Check logs: `docker-compose logs -f`
  * ✅ Verify all required environment variables are set
  * ✅ Ensure the Discord token is valid

### Debugging

1. **Enable Debug Logging**
   Set `LOG_LEVEL=debug` in your `.env` file for more detailed logs.

2. **Check Container Logs**

   ```bash
   docker-compose logs -f
   ```

3. **Test Commands**

   ```bash
   # Test environment variables
   docker-compose exec bot env

   # Get a shell in the container
   docker-compose exec bot sh
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

* [Discord.js](https://discord.js.org/) - The library that powers this bot
* [Google Sheets API](https://developers.google.com/sheets/api) - For spreadsheet integration
* [Challonge API](https://api.challonge.com/v1) - For tournament management
* [TypeScript](https://www.typescriptlang.org/) - For type safety and better developer experience
