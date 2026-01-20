import {
  EmbedBuilder,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { SlashCommandT, type OptionT } from "diskernel";
import { Aviutl2Release } from "../database/schema/aviutl2Release.js";
import { SdkRelease } from "../database/schema/sdkRelease.js";
import pkg from "../../package.json" with { type: "json" };

function toYYYYMMDD(date: Date | NativeDate) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export class GetLatestInfo extends SlashCommandT {
  public name: string = "getlatestinfo";
  public description: string = "最新のリリース情報を取得します";
  public global = true;
  public option: OptionT[] = [
    {
      type: "string" as const,
      name: "type",
      description: "リリースのタイプ",
      required: true,
      choices: [
        {
          name: "AviUtl2",
          value: "AviUtl2",
        },
        {
          name: "SDK",
          value: "SDK",
        },
      ],
    },
  ];

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const type = interaction.options.get("type", true);
    if (
      !type.value ||
      !["AviUtl2", "SDK"].includes(type.value?.toString() ?? "")
    ) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌️ エラー")
            .setDescription(
              "`type`に有効な値を指定してください。`AviUtl2` または `SDK` を想定していました。",
            )
            .setColor("Red")
            .setTimestamp(),
        ],
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    await interaction.deferReply();

    switch (type.value) {
      case "AviUtl2":
        const aviutl2ReleaseData = await Aviutl2Release.findOne()
          .sort({ releasedDate: -1 })
          .lean();
        if (!aviutl2ReleaseData) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌️ エラー")
                .setDescription("アップデート情報が取得されていません。")
                .setColor("Red")
                .setTimestamp(),
            ],
          });
          break;
        }
        const aviutl2ReleaseComponent = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### AviUtl ExEdit2 ${aviutl2ReleaseData._id} - ${toYYYYMMDD(aviutl2ReleaseData.releasedDate)} の情報`,
            ),
            new TextDisplayBuilder().setContent(
              `**バージョン**: ${aviutl2ReleaseData._id}\n**リリース日**: ${toYYYYMMDD(aviutl2ReleaseData.releasedDate)}\n\n**更新情報(aviutl2.txtより)**: \`\`\`plaintext\n${aviutl2ReleaseData.aviutl2ReleaseNote ?? "情報が見つかりませんでした"}\n\n\`\`\`\n**更新情報(lua.txtより)**: \`\`\`plaintext\n${aviutl2ReleaseData.luaReleaseNote ?? "情報が見つかりませんでした"}\n\`\`\``,
            ),
          )
          .addSeparatorComponents(
            new SeparatorBuilder()
              .setDivider(true)
              .setSpacing(SeparatorSpacingSize.Small),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `AviUtl ExEdit2 ${aviutl2ReleaseData._id} のダウンロードリンク`,
            ),
          )
          .addSectionComponents(
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("インストーラー版"),
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel("ダウンロード")
                  .setURL(aviutl2ReleaseData.exeUrl),
              ),
            new SectionBuilder()
              .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("Zip版"),
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel("ダウンロード")
                  .setURL(aviutl2ReleaseData.zipUrl),
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
              `-# [AviUtl Release Notify v${pkg.version}](<https://discord.com/oauth2/authorize?client_id=1416628772710645851>) by Yu-yu0202`,
            ),
          );
        await interaction.editReply({
          components: [aviutl2ReleaseComponent],
          flags: [MessageFlags.IsComponentsV2],
        });
        break;
      case "SDK":
        const SdkReleaseData = await SdkRelease.findOne()
          .sort({ _id: -1 })
          .lean();
        if (!SdkReleaseData) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌️ エラー")
                .setDescription("アップデート情報が取得されていません。")
                .setColor("Red")
                .setTimestamp(),
            ],
          });
          break;
        }
        const SdkReleaseComponent = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### AviUtl ExEdit2 SDK - ${toYYYYMMDD(SdkReleaseData._id)} の情報`,
            ),
            new TextDisplayBuilder().setContent(
              `**リリース日**: ${toYYYYMMDD(SdkReleaseData._id)}\n\n**更新情報(aviutl2_plugin_sdk.txtより)**: \n\`\`\`plaintxt\n${SdkReleaseData.releaseNote ?? "情報が見つかりませんでした"}\n\`\`\``,
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
              `-# [AviUtl Release Notify v${pkg.version}](<https://discord.com/oauth2/authorize?client_id=1416628772710645851>) by Yu-yu0202`,
            ),
          );

        await interaction.editReply({
          components: [SdkReleaseComponent],
          flags: [MessageFlags.IsComponentsV2],
        });
        break;
    }
  }
}
