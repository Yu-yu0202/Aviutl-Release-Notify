import { metadata } from ".";
import { ChatInputCommandInteraction} from "discord.js";
import { UpdateHandler } from "../handler/UpdateHandler";

interface CustomInteraction extends ChatInputCommandInteraction {
    handler: UpdateHandler;
}

export class update implements metadata {
    public name = "update";
    public description = "手動トリガーでリリースの確認を行います";
    public async execute(interaction: ChatInputCommandInteraction, ): Promise<void> {
        console.log("[UpdateHandler] Test command executed, starting update process...");
        await interaction.deferReply();
        await (interaction as CustomInteraction).handler.manual_update();
        await interaction.editReply({"content": "更新しました。"});
        console.log("[UpdateHandler] Test command completed.");
    }
}