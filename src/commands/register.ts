import {
  ChatInputCommandInteraction,
  MessageFlags,
  EmbedBuilder,
} from "discord.js";
import { type CommandMeta, DatabaseManager } from "botmanager";

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
    const channel = interaction.options.getChannel("対象チャンネル");
    if (!channel || !("id" in channel)) {
      await interaction.reply({
        content: "有効なチャンネルを指定してください。",
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
      flags: [MessageFlags.Ephemeral],
    });
    await DB.close();
  }
}
