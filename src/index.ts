import { BotManager, DatabaseManager, Logger } from "botmanager";
import { WhatsNewUtil } from "./utils/whats-new.util.js";
import { WatchUpdateHandler } from "./handler/WatchUpdate.Handler.js";
import * as fs from "fs";

await BotManager.start();

if (!fs.existsSync("data")) {
  fs.mkdirSync("data", { recursive: true });
}
const DB = new DatabaseManager();
await DB.run(
  "CREATE TABLE IF NOT EXISTS channelIds (channelId TEXT PRIMARY KEY)",
);
await DB.close();

await WhatsNewUtil.init();

const WUHandler = new WatchUpdateHandler();
await WUHandler.start();

process.on("SIGINT", () => {
  WUHandler.stop();
  Logger.log("✅️ SIGINT received. Stopping...");
  process.exit(0);
});
