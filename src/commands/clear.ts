import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { SlashCommandT } from "diskernel";
import { ReleaseInfo } from "../utils/releaseInfo.js";
export class Clear extends SlashCommandT {
  public name: string = "clear";
  public description: string = "リリース情報をクリアします [管理者のみ]";
  public isAdminOnly: boolean = true;
  public option = [
    {
      name: "type",
      description: "クリアするデータのタイプ",
      type: "string" as const,
      choices: [
        {
          name: "AviUtl2",
          value: "aviutl2",
        },
        {
          name: "SDK",
          value: "sdk",
        },
        {
          name: "すべて",
          value: "all",
        },
      ],
      required: true,
    },
  ];

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const type = interaction.options.get("type", true);
    if (
      !type.value ||
      !["aviutl2", "sdk", "all"].includes(type.value?.toString() ?? "")
    ) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription(
              "`type`に有効な値を指定してください。`aviutl2` または `sdk` または `all` を想定していました。",
            )
            .setColor("Red")
            .setTimestamp(),
        ],
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }
    await interaction.deferReply({
      flags: [MessageFlags.Ephemeral],
    });

    switch (type.value) {
      case "aviutl2":
        await ReleaseInfo.deleteAviUtl2ReleaseData();
        break;
      case "sdk":
        await ReleaseInfo.deleteSDKReleaseData();
        break;
      case "all":
        await ReleaseInfo.deleteAviUtl2ReleaseData();
        await ReleaseInfo.deleteSDKReleaseData();
        break;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 完了")
          .setDescription("リリース情報をクリアしました。")
          .setColor("Green")
          .setTimestamp(),
      ],
    });
  }
}
