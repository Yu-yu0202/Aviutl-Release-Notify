import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { type CommandMeta, Config, DatabaseManager, Logger } from "botmanager";

export class Unregister implements CommandMeta {
  public name: string = "unregister";
  public description: string = "通知を停止します";
  public options = [
    {
      name: "対象チャンネル",
      description: "通知を停止するチャンネル",
      type: "channel" as const,
      required: true,
    },
  ];
  public type: "slash" = "slash";

  public async exec(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
      !Config.get().options?.adminuserid?.includes(interaction.user.id)
    ) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription(
              `このコマンドを実行するには「サーバーを管理」権限が必要です。`,
            )
            .setColor("Green")
            .setTimestamp(),
        ],
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }
    const channel = interaction.options.getChannel("対象チャンネル")!;
    const DB = new DatabaseManager();
    if (
      await DB.get("SELECT channelId FROM channelIds WHERE channelId = ?", [
        channel.id,
      ])
    ) {
      await DB.queue("DELETE FROM channelIds WHERE channelId = ?", [
        channel.id,
      ]);

      try {
        await DB.commit();
      } catch (e: unknown) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌️ エラー")
              .setDescription(`不明なエラーが発生しました`)
              .setColor("Green")
              .setTimestamp(),
          ],
          flags: [MessageFlags.Ephemeral],
        });
        Logger.log(
          `Error in processing unregister command: ${(e as Error).message}`,
          "warn",
        );
        DB.close();
        return;
      }
    } else {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription(`そのチャンネルは登録されていません。`)
            .setColor("Green")
            .setTimestamp(),
        ],
        flags: [MessageFlags.Ephemeral],
      });
    }
    DB.close();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 停止しました")
          .setDescription(`<#${channel.id}> への通知を停止しました。`)
          .setColor("Green")
          .setTimestamp(),
      ],
    });
  }
}
