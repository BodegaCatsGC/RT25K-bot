# iOS Setup

This folder contains a lightweight React Native project used for testing RT25K bot functionality on iOS. The project lives in `ios/` at the repository root.

## Prerequisites

- Node.js 18+
- Xcode with command line tools
- `react-native` CLI (`npx react-native --version`)

## Install Dependencies

```bash
cd ios
npm install
```

## Running on Simulator

```bash
npm run ios
```

This will start the React Native packager and launch the iOS simulator.

## Running Tests

Run unit tests using React Native's built-in test runner:

```bash
npm test
```

This executes Jest tests defined in the `ios` project.

## Environment

The UI expects a Discord bot token and optional API keys for Google Sheets and Challonge. Enter these on the login and configuration screens.

## Building for Release

1. Open `ios` in Xcode.
2. Select your signing team and adjust bundle identifiers if needed.
3. Build or archive the project via Xcode.

