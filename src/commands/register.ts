import {
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { SlashCommandT, Config } from "diskernel";
import { Registration } from "../database/schema/registration.js";

export class Register extends SlashCommandT {
  public name: string = "register";
  public description: string = "通知の送信先を登録します";
  public option = [
    {
      name: "対象チャンネル",
      description: "通知を送信するチャンネル",
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

    const channel = interaction.options.getChannel("対象チャンネル", true);
    if (!channel || channel.type !== ChannelType.GuildText || !channel.id) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription("有効なテキストチャンネルを指定してください。")
            .setColor("Red")
            .setTimestamp(),
        ],
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    await interaction.deferReply();

    await Registration.updateOne(
      { _id: channel.id },
      { $setOnInsert: { _id: channel.id } },
      { upsert: true },
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 完了")
          .setDescription(`<#${channel.id}> に通知を設定しました。`)
          .setColor("Green")
          .setTimestamp(),
      ],
    });
  }
}
