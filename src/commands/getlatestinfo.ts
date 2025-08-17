import { metadata } from ".";
import { ButtonBuilder, ChatInputCommandInteraction, ButtonStyle, ContainerBuilder, EmbedBuilder, MessageFlags, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } from "discord.js";
import { WhatsNewUtil } from "../util/whats-new.util.js";
import pkg from '../../package.json' with {type: "json"};

export class getlatestinfo implements metadata {
    public name: string = "getlatestinfo";
    public description: string = "最新のアップデート情報を取得します";
    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        let latestinfo: {version: string, date: string, info: string};
        try {
            latestinfo = await WhatsNewUtil.getFromFile();
        } catch(e: any) {
            if (e instanceof Error && e.message === "latest.json does not exist") {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("エラー")
                    .setDescription("最新のアップデート情報がまだ取得されていません。")
                    .setTimestamp()
                
                await interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
                return;
            } else {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("エラー")
                    .setDescription(`不明なエラーが発生しました: ${e.message}`)
                    .setTimestamp();
                
                console.error(`Error in getlatestinfo command: ${e.message}`);

                await interaction.reply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }
        const components = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`### AviUtl ExEdit2 ${latestinfo.version} - ${latestinfo.date} の情報`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`バージョン: ${latestinfo.version}\nリリース日: ${latestinfo.date}\n更新情報: \`\`\`txt\n${latestinfo.info}\n\`\`\``)
            )
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent("インストーラー版:")
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setLabel("ダウンロード")
                            .setURL(`https://spring-fragrance.mints.ne.jp/aviutl/AviUtl2${latestinfo.version.toLowerCase()}_setup.exe`)
                    ),
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent("Zip版:")
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setLabel("ダウンロード")
                            .setURL(`https://spring-fragrance.mints.ne.jp/aviutl/aviutl2${latestinfo.version.toLowerCase()}.zip`)
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(true)
                    .setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent("-# このツールの使用により生じた問題は、作者は一切責任を負いません。\n-# 正確な情報を確認してください。")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`-# AviUtl Release Notify v${pkg.version} by Yu-yu0202`)
            )
            interaction.reply({
                components: [components],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
            });
    }
}