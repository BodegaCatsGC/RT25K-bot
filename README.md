# RT25K Discord Bot

A Discord bot for RT25K with Google Sheets integration for real-time standings.

## Features

- Modern Discord.js v14 implementation
- Command and event handler system
- Slash commands support
- Google Sheets integration for real-time standings
- Logging with Winston

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env` file and fill in your configuration:
   - Set up your Discord bot token and client ID
   - Configure Google Sheets API credentials (see Google Sheets Integration section below)
4. Start the bot:
   ```bash
   npm start
   ```

## Development

To run the bot in development mode with automatic reloading:

```bash
npm run dev
```

## Project Structure

- `src/` - Source code
  - `commands/` - Bot slash commands
  - `events/` - Event handlers
  - `handlers/` - Command and event handlers
  - `utils/` - Utility functions including Google Sheets integration
- `service-account.json` - Google Cloud service account credentials (keep this private!)
- `.env` - Environment variables (keep this private!)

## Available Commands

### /standings
Display the current RT25K standings from Google Sheets.

**Options:**
- `team` (Optional): Filter standings by team name (case-insensitive, partial match)

**Examples:**
```
/standings
/standings team:Bodega
```

### Other Commands
- `/help` - Shows help information
- `/ping` - Check if the bot is responsive
- `/serverinfo` - Display server information
- `/userinfo` - Display user information

## Google Sheets Integration

The bot can fetch and display standings data from a Google Sheet. Here's how to set it up:

1. **Set up a Google Cloud Project**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Sheets API
   - Create a service account and download the JSON key file

2. **Configure Environment Variables**
   Add these to your `.env` file:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_client_id
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SHEETS_WORKSHEET_NAME=Overall Standings
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=your_private_key
   ```

3. **Share your Google Sheet**
   - Open your Google Sheet
   - Click "Share" and add your service account email as an editor

## Adding Commands

Create a new file in the `src/commands/` directory with the following structure:

```javascript
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description')
    // Add options if needed
    .addStringOption(option =>
      option.setName('optionname')
        .setDescription('Option description')
        .setRequired(false)),
        
  async execute(interaction) {
    // Command code here
    await interaction.reply('Command response');
  },
};
```

## Troubleshooting

### Common Issues

1. **Google Sheets API Errors**
   - Ensure the service account has edit access to the spreadsheet
   - Verify the spreadsheet ID and worksheet name are correct
   - Check that the private key is properly formatted with `\n` for newlines
   - Make sure the service account email is added as an editor to the Google Sheet

2. **Standings Command**
   - If standings don't appear, check the bot's console for error messages
   - Ensure your Google Sheet has at least these columns:
     - Column 1: Position
     - Column 2: Team Name
     - Column 3: Total Points

## License