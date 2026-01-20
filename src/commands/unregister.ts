import {
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { SlashCommandT, Config } from "diskernel";
import { Registration } from "../database/schema/registration.js";

export class Unregister extends SlashCommandT {
  public name: string = "unregister";
  public description: string = "通知の設定を解除します";
  public option = [
    {
      name: "対象チャンネル",
      description: "通知を停止するチャンネル",
      type: "channel" as const,
      required: true,
    },
  ];

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (
      !(
        interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
        Config.get("options").adminIds?.includes(interaction.user.id)
      )
    ) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription(
              "このコマンドを実行するには「サーバーを管理」権限が必要です。",
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

    const channel = interaction.options.getChannel("対象チャンネル", true);
    const result = await Registration.deleteOne({ _id: channel.id });

    if (result.deletedCount === 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription(`そのチャンネルは登録されていません。`)
            .setColor("Green")
            .setTimestamp(),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 完了")
          .setDescription(`<#${channel.id}> への通知を停止しました。`)
          .setColor("Green")
          .setTimestamp(),
      ],
    });
  }
}
