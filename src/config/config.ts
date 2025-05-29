// Configuration interface
export interface BotConfig {
  token: string;
  prefix: string;
  defaultCommandCooldown: number;
}

// Default configuration
const config: BotConfig = {
  token: process.env.DISCORD_TOKEN || "PASTE YOUR TOKEN IN HERE",
  prefix: process.env.PREFIX || "!",
  defaultCommandCooldown: 1
};

export default config;
