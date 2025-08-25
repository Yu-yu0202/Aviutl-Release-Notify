import { type Events, DatabaseManager } from "botmanager";

export class ClientReady implements Events {
  public name: string = "ClientReady";
  public once: boolean = true;

  public async exec(): Promise<void> {
    await new DatabaseManager()
      .queue(
        "CREATE TABLE IF NOT EXISTS channelIds (channelId TEXT PRIMARY KEY)",
      )
      .commit()
      .then((DB) => {
        DB.close();
      });
  }
}
