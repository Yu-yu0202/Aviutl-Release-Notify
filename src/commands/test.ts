import { metadata } from ".";
import { ChatInputCommandInteraction} from "discord.js";
import { UpdateHandler } from "../handler/UpdateHandler";

interface CustomInteraction extends ChatInputCommandInteraction {
    handler: UpdateHandler;
}

export class test implements metadata {
    public name = "test";
    public description = "Test command";
    public async execute(interaction: ChatInputCommandInteraction, ): Promise<void> {
        console.log("[UpdateHandler] Test command executed, starting update process...");
        await interaction.deferReply();
        await (interaction as CustomInteraction).handler.manual_update();
        await interaction.editReply({"content": "テストが完了しました。サーバーログを確認してください。"});
        console.log("[UpdateHandler] Test command completed.");
    }
}