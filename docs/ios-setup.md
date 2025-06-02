# iOS Setup

This folder now contains a lightweight SwiftUI application used for testing RT25K bot functionality on iOS. The project lives in `ios/` at the repository root.

## Prerequisites

- Xcode 14 or higher

## Running on Simulator

Open the `ios` folder in Xcode and run the `RT25KApp` scheme on a simulator or device. The app is self-contained and does not require any package manager setup.

## Tests

There are currently no automated tests for the iOS app.

## Environment

The UI expects a Discord bot token and optional API keys for Google Sheets and Challonge. Enter these on the login and configuration screens.

## Building for Release

1. Open `ios` in Xcode.
2. Select your signing team and adjust bundle identifiers if needed.
3. Build or archive the project via Xcode.
