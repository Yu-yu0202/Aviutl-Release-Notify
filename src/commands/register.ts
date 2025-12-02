import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { type CommandMeta, Config, DatabaseManager } from "botmanager";

export class Register implements CommandMeta {
  public name: string = "register";
  public description: string = "このサーバーに通知を送信するよう設定します";
  public options = [
    {
      name: "対象チャンネル",
      description: "通知を送信するチャンネル",
      type: "channel" as const,
      required: true,
    },
  ];
  public type: "slash" = "slash";

  public async exec(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    if (
      !(
        interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
        Config.get().options?.adminuserid?.includes(interaction.user.id)
      )
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

    const channel = interaction.options.getChannel("対象チャンネル");
    if (
      !channel ||
      !("id" in channel) ||
      channel.type !== ChannelType.GuildText ||
      !("send" in channel)
    ) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription(`有効なテキストチャンネルを指定してください。`)
            .setColor("Green")
            .setTimestamp(),
        ],
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }
    const channelId: string = channel.id;
    const DB: DatabaseManager = new DatabaseManager();
    await DB.query("INSERT OR REPLACE INTO channelIds (channelId) VALUES (?)", [
      channelId,
    ]);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅️ 設定しました")
          .setDescription(`<#${channelId}> に通知を設定しました。`)
          .setColor("Green")
          .setTimestamp(),
      ],
    });
    await DB.close();
  }
}
