import { CommandMeta, Logger } from "botmanager";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import * as fs from "fs";

export class Clear implements CommandMeta {
  public name: string = "clear";
  public description: string = "rssデータをクリアします [AdminOnly]";
  public type: "slash" = "slash";
  public adminOnly: boolean = true;

  public async exec(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    Logger.log(
      "[UpdateHandler] Clear command executed, clearing RSS data...",
      "info",
    );
    if (fs.existsSync("data/rss/aviutl.xml")) {
      fs.unlinkSync("data/rss/aviutl.xml");
      Logger.log("[UpdateHandler] RSS data cleared successfully.", "info");
    } else {
      Logger.log("[UpdateHandler] No RSS data found to clear.", "warn");
    }
    await interaction.editReply({ content: "rss/xmlデータをクリアしました。" });
  }
}
