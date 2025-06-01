# CHANGELOG

## [v1.0.0-beta.1](https://github.com/BodegaCatsGC/RT25K-bot/releases/tag/v1.0.0-beta.1) - 2025-05-31 02:06:51

# 🚀 RT25K Bot v1.0.0-beta.1 — First Public Beta

> ⚠️ This is a beta release. Features may change, and bugs may exist. Please report issues in the [GitHub issue tracker](https://github.com/yourusername/RT25K-bot/issues).

## ✨ What’s New

### ✅ Core Features
- 💬 **Discord.js v14**: Built on the latest Discord.js framework with full slash command support and autocomplete.
- 📊 **Google Sheets Integration**: Fetch and display RT25K standings in real time from Google Sheets.
- 🏆 **Challonge API Integration (Basic)**: Pull tournament details via the `/tournament` command using Challonge IDs or URLs.
- 🐳 **Docker Support**: Runs fully containerized using Docker and Docker Compose.
- 📁 **Environment-based Config**: Easily switch between environments with `.env` files or Docker secrets.
- 🧾 **Structured Logging**: Uses Winston to provide clean, filtered logs by severity level.

---

## ⚙️ Setup Guide

### Local Development

```bash
git clone https://github.com/BodegaCatsGC/RT25K-bot.git
cd RT25K-bot
npm install
cp .env.example .env
# → Fill out your .env file with Discord and API credentials
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d
```

---

## 📋 Known Issues

- 🧠 Edge cases in command input (e.g., bad tournament ID, misspelled team names) not yet fully handled.
- 📚 Some documentation is still incomplete or marked as TODO.
- 🐢 No caching or pagination yet; large Sheets or tournaments may cause lag.
- 🔄 Sheet update rate limits not currently tracked or logged.

---

## 🔮 Coming Soon

- 🛠 Admin commands for managing config and data in real time.
- 🔧 Error handling improvements with inline fallback messages.
- 📉 Stats caching and leaderboard generation.
- 🧪 CI tests and validation scripts.
- 📊 Embedded game result summaries and win tracking.

---

## 🙌 Acknowledgments

Special thanks to the RT25K community and early testers from Bodega Cats GC for providing feedback during development.

---

## 🧠 Useful Links

- 📦 [GitHub Repo](https://github.com/yourusername/RT25K-bot)
- 🐛 [Issue Tracker](https://github.com/yourusername/RT25K-bot/issues)
- 📄 [RT25K Overview](https://bodegacatsgc.gg/rt25k)

### Features

- general:
  - implement Google Sheets integration for standings and schedule data ([6784256](https://github.com/BodegaCatsGC/RT25K-bot/commit/6784256e9e3830e3229a56c8d15fa34a86298ccc))
  - implement Discord bot core with Docker Swarm secrets support ([a27c5b5](https://github.com/BodegaCatsGC/RT25K-bot/commit/a27c5b5c177241dd323a1416055a7c9b9b1d23c5))
  - add Docker configuration for containerized deployment of RT25K-bot ([85f4f4c](https://github.com/BodegaCatsGC/RT25K-bot/commit/85f4f4cfeb638d2c9223e5783040c97b3f3a2e1c))
  - implement Google Sheets integration and team schedule command ([c3fa6d1](https://github.com/BodegaCatsGC/RT25K-bot/commit/c3fa6d1306f1f493e1ff94b1139758f1a248baed))
  - implement Google Sheets integration for fetching standings and schedules ([b45953f](https://github.com/BodegaCatsGC/RT25K-bot/commit/b45953fdcc028b8c94130c169c43e8b3f18a8128))
  - implement team schedule command with game recaps and series tracking ([41124c4](https://github.com/BodegaCatsGC/RT25K-bot/commit/41124c40477e82f65c587298a81eba9bc0a592a6))
  - add schedule command with Google Sheets integration for viewing team game recaps ([6fb7e4f](https://github.com/BodegaCatsGC/RT25K-bot/commit/6fb7e4f71e569df95e949e5ebc0ca17b85a3b2ca))
  - add tournament and standings commands with Google Sheets integration ([1ae3b5b](https://github.com/BodegaCatsGC/RT25K-bot/commit/1ae3b5bdffbf4173d0aa63c83a86b3ee28bb8fba))
  - add Challonge tournament integration with API client and command ([11afecc](https://github.com/BodegaCatsGC/RT25K-bot/commit/11afecc804366670110019d76d9481eadccb8113))
  - replace TypeScript and Activity app with Google Sheets integration ([ba24cde](https://github.com/BodegaCatsGC/RT25K-bot/commit/ba24cdeb7903ae83b32859c85cc98dd460962a8f))
  - add Google Sheets integration and standings command ([ec0747f](https://github.com/BodegaCatsGC/RT25K-bot/commit/ec0747f23fb4267cc2d099f6f9fbddc08362123c))
  - add Google Sheets integration and standings command ([53e5d8f](https://github.com/BodegaCatsGC/RT25K-bot/commit/53e5d8f7a0c2665a3a59a6d00ccb69a0661b0318))
  - initialize Discord bot with core commands and activity manager ([fa64676](https://github.com/BodegaCatsGC/RT25K-bot/commit/fa64676ce63ec5c1fc153bcbcdbc2c947e8c18fd))
  - initialize Discord.js bot with core functionality and commands ([bb3c1f9](https://github.com/BodegaCatsGC/RT25K-bot/commit/bb3c1f9268e2b93849a14a7459dd920dfaf7e29a))

### Documentation

- general:
  - update README with TypeScript features, Docker support, and improved documentation structure ([d417ac6](https://github.com/BodegaCatsGC/RT25K-bot/commit/d417ac6ce0ceade8278a22d0de0dd03bac015397))

### Refactors

- general:
  - rename Docker configuration files with dot prefix for consistency ([5d8deef](https://github.com/BodegaCatsGC/RT25K-bot/commit/5d8deef490f02d285234f81bbe6933c34be9a2fa))
  - migrate from TypeScript to JavaScript by removing TS dependencies and config ([32d5263](https://github.com/BodegaCatsGC/RT25K-bot/commit/32d52639d2c737ee18bfc44960383597d142a896))

###  chores

- general:
  - add Docker configuration and environment variable templates for RT25K bot ([1c44144](https://github.com/BodegaCatsGC/RT25K-bot/commit/1c44144de0a51b9b8d83902bae0aac8794b57e18))
  - update ignore files to exclude .secrets and .env.txt while allowing .env in Docker ([fd981a7](https://github.com/BodegaCatsGC/RT25K-bot/commit/fd981a7ff5cd24a4d7f76205f3085143311c3105))
  - gs firebase ([9f3749a](https://github.com/BodegaCatsGC/RT25K-bot/commit/9f3749a3bd711d5be09a124b2d20538ce0e32f85))
  - update dependencies and remove .env.example ([5e11809](https://github.com/BodegaCatsGC/RT25K-bot/commit/5e1180938ec0afb6037b0161ce75f208980dd7ed))
  - initialize Discord bot project with dependencies and base commands ([853b05c](https://github.com/BodegaCatsGC/RT25K-bot/commit/853b05c7b715b1adb2af8e986cd394b6fc04dbfc))

\* *This CHANGELOG was automatically generated by [auto-generate-changelog](https://github.com/BobAnkh/auto-generate-changelog)*
