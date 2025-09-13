import { GatewayIntentBits } from "discord.js";

export const config = {
  token: process.env.DISCORD_TOKEN || "",
  intents: [GatewayIntentBits.Guilds],
  options: {
    adminuserid: ["1264130543008612426"],
    log: {
      logLevel: "info",
      enable_console: true,
    },
    db: {
      type: "sqlite",
      file: "data/bot.db",
    },
    feature: {
      command_autoload: true,
      event_autoload: true,
      enable_admin_commands: true,
      enable_dev_commands: true,
    },
  },
};
