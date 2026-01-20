import { type ConfigT } from "diskernel";
import { ENV } from "./__env__.js";

export const config: ConfigT = {
  TOKEN: ENV.DISCORD_TOKEN,
  intents: ["Guilds"],
  options: {
    adminIds: ["1264130543008612426"],
    logging: {
      level: "debug",
      enableFileLogging: true,
      logFilePath: "./data/bot.log",
    },
    feature: {
      enableCommandAutoload: true,
      enableEventAutoload: false,
      enableAdminCommands: true,
      enableDevelopmentCommands: false,
    },
  },
};
