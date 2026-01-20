import { Config, Core } from "diskernel";
import { config } from "./config.js";
import { Database } from "./database/connectionManager.js";

new Config(config);

await Database.ensureConnected();

await Core.start();
