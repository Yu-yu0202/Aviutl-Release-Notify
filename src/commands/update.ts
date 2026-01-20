import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { SlashCommandT } from "diskernel";
import { ReleaseInfo } from "../utils/releaseInfo.js";

export class Update extends SlashCommandT {
  public name: string = "update";
  public description: string = "最新の情報を取得します";
  public isCooldownEnabled: boolean = true;
  public globalCooldownTime: number = 20 * 60;

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    await interaction.deferReply();
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 進行中...")
          .setDescription("最新の情報を取得するよう通知しました。")
          .setColor("Green")
          .setTimestamp(),
      ],
    });
    await ReleaseInfo.cronJob();
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 完了")
          .setDescription("最新の情報を取得しました。")
          .setColor("Green")
          .setTimestamp(),
      ],
    });
  }
}
