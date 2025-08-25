import {
  EmbedBuilder,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  ButtonBuilder,
  SeparatorSpacingSize,
  ButtonStyle,
} from "discord.js";
import { Logger, type CommandMeta } from "botmanager";
import type { ChatInputCommandInteraction } from "discord.js";
import pkg from "../../package.json" with { type: "json" };
import { WhatsNewUtil } from "../utils/whats-new.util.js";

export class Getlatestinfo implements CommandMeta {
  public name: string = "getlatestinfo";
  public description: string = "最新のアップデート情報を取得します";
  public type: "slash" = "slash";

  public async exec(interaction: ChatInputCommandInteraction): Promise<void> {
    let latestinfo: { version: string; date: string; info: string };
    try {
      latestinfo = await WhatsNewUtil.getFromFile();
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "latest.json does not exist") {
        const embed: EmbedBuilder = new EmbedBuilder()
          .setColor("Red")
          .setTitle("エラー")
          .setDescription("最新のアップデート情報がまだ取得されていません。")
          .setTimestamp();

        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        const embed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("エラー")
          .setDescription(`不明なエラーが発生しました: ${(e as Error).message}`)
          .setTimestamp();

        Logger.log(
          `Error in getlatestinfo command: ${(e as Error).message}`,
          "warn",
        );

        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }
    const components = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### AviUtl2 ${latestinfo.version} - ${latestinfo.date} の情報`,
        ),
        new TextDisplayBuilder().setContent(
          `バージョン: ${latestinfo.version}\nリリース日: ${latestinfo.date}\n更新情報: \`\`\`txt\n${latestinfo.info}\n\`\`\``,
        ),
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("インストーラー版:"),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("ダウンロード")
              .setURL(
                `https://spring-fragrance.mints.ne.jp/aviutl/AviUtl2${latestinfo.version.toLowerCase()}_setup.exe`,
              ),
          ),
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("Zip版:"),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("ダウンロード")
              .setURL(
                `https://spring-fragrance.mints.ne.jp/aviutl/aviutl2${latestinfo.version.toLowerCase()}.zip`,
              ),
          ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "-# このツールの使用により生じた問題は、作者は一切責任を負いません。\n-# 正確な情報を確認してください。",
        ),
        new TextDisplayBuilder().setContent(
          `-# AviUtl Release Notify v${pkg.version} by Yu-yu0202`,
        ),
      );

    await interaction.reply({
      components: [components],
      flags: [MessageFlags.IsComponentsV2],
    });
  }
}
