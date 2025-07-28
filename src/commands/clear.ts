import { metadata } from ".";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import * as fs from "fs";
await import("dotenv/config");

export class clear implements metadata {
    public name = "clear";
    public description = "rssデータをクリアします";
    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.user.id !== process.env.ADMIN_ID) {
            await interaction.reply({ content: "このコマンドは管理者のみが実行できます。", flags: MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply();
        console.log("[UpdateHandler] Clear command executed, clearing RSS data...");
        if (fs.existsSync("rss/aviutl.xml")) {
            fs.unlinkSync("rss/aviutl.xml");
            console.log("[UpdateHandler] RSS data cleared successfully.");
        } else {
            console.warn("[UpdateHandler] No RSS data found to clear.");
        }
        await interaction.editReply({"content": "rss/xmlデータをクリアしました。"});
    }
}