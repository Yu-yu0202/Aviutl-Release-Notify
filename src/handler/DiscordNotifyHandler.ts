import { XMLParser } from 'fast-xml-parser';
import { ButtonBuilder, ButtonStyle, Client, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder} from 'discord.js';
import pkg from '../../package.json' with {type: "json"};

export class DiscordNotifyHandler {
    private client: Client;
    private channelId: string;
    constructor(client: Client, channelId: string) {
        this.client = client;
        this.channelId = channelId;
    }
    public notify(raw_rss: string) {
        const parser = new XMLParser();
        const rss = parser.parse(raw_rss);
        const message = rss.rss?.channel?.item?.title.split('を')?.[0] + "が公開されました！"
        const title = rss.rss?.channel?.item?.title.split(' ')
        const downloadLink: {setup: string, zip: string} = {
            setup: `https://spring-fragrance.mints.ne.jp/aviutl/AviUtl2${String(title[2]).toLowerCase()}_setup.exe`,
            zip: `https://spring-fragrance.mints.ne.jp/aviutl/aviutl2${String(title[2]).toLowerCase()}.zip`
        };

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`### ${message}`)
        )
        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`${message}`)
        )
        container.addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Large)
        )
        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`AviUtl ${title[1] + title[2]}のダウンロードリンク`)
        )
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`セットアップ版`)
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setLabel('ダウンロード')
                        .setURL(downloadLink.setup)
                        .setStyle(ButtonStyle.Link)
                ),
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(`Zip版`)
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setLabel('ダウンロード')
                        .setURL(downloadLink.zip)
                        .setStyle(ButtonStyle.Link)
                )
        )
        container.addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Small)
        )
        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent("-# このツールの使用による問題は、作者は一切責任を負いません。正確な情報を確認してください。")
        )
        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`-# AviUtl Release Notify v${pkg.version} by Yu-yu0202`)
        )

        const channel = this.client?.channels.cache.get(this.channelId);
        if (!channel || !channel.isTextBased() || channel.type !== 0) {
            console.error('Channel not found or is not a text channel.');
            return;
        }
        channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        })
    }
}