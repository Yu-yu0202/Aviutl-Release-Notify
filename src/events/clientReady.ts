import { type Events, DatabaseManager } from "botmanager";

export class ClientReady implements Events<"clientReady"> {
  public name: "clientReady" = "clientReady";
  public once: boolean = true;

  public async exec(): Promise<void> {
    await new DatabaseManager()
      .queue(
        "CREATE TABLE IF NOT EXISTS channelIds (channelId TEXT PRIMARY KEY)",
      )
      .then((DB) => DB.commit())
      .then((DB) => DB.close());
  }
}
