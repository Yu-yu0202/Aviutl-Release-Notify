import { metadata } from ".";
import { ChatInputCommandInteraction} from "discord.js";
import { WatchUpdateHandler } from "../handler/WatchUpdate.handler";

interface CustomInteraction extends ChatInputCommandInteraction {
    handler: WatchUpdateHandler;
}

export class update implements metadata {
    public name: string = "update";
    public description: string = "手動トリガーでリリースの確認を行います";
    public async execute(interaction: ChatInputCommandInteraction, ): Promise<void> {
        console.log("[UpdateHandler] Update command executed, starting update process...");
        await interaction.deferReply();
        await (interaction as CustomInteraction).handler.manual_update();
        await interaction.editReply({"content": "更新しました。"});
        console.log("[UpdateHandler] Update command completed.");
    }
}