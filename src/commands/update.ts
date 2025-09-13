import { type CommandMeta } from "botmanager";
import { type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { WatchUpdateHandler } from "../handler/WatchUpdate.Handler.js";

export class Update implements CommandMeta {
  public name: string = "update";
  public description: string = "手動更新を行います";
  public type: "slash" = "slash";
  public cooldown: number = 15 * 60;

  public async exec(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    new WatchUpdateHandler().manual_update();
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 更新しました")
          .setDescription("最新の情報を取得しました。")
          .setColor("Green")
          .setTimestamp(),
      ],
    });
  }
}
