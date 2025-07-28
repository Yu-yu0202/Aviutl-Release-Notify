import { XMLParser } from 'fast-xml-parser';
import { ButtonBuilder, ButtonStyle, Client, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, TextChannel, ChannelType } from 'discord.js';
import pkg from '../../package.json' with {type: "json"};

export class DiscordNotifyHandler {
    private client: Client;
    private channelIds: string[];
    constructor(client: Client, channelIds: string[] | string) {
        this.client = client;
        if (Array.isArray(channelIds)) {
            this.channelIds = channelIds.flatMap(id => typeof id === "string" ? id.split(",").map(s => s.trim()).filter(Boolean) : []);
        } else if (typeof channelIds === "string") {
            this.channelIds = channelIds.split(",").map(s => s.trim()).filter(Boolean);
        } else {
            this.channelIds = [];
        }
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
                .setContent(`AviUtl ${title[1] + " " + title[2]}のダウンロードリンク`)
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
                .setContent("-# このツールの使用により生じた問題は、作者は一切責任を負いません。\n-# 正確な情報を確認してください。")
        )
        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`-# AviUtl Release Notify v${pkg.version} by Yu-yu0202`)
        )

        this.channelIds.forEach(channelId => {
            console.info(`[DiscordNotifyHandler] Sending message to channel (${channelId})...`);
            const channel = this.client?.channels.cache.get(channelId);
            if (!channel || !channel.isTextBased()) {
                console.error(`[DiscordNotifyHandler] Channel (${channelId}) not found or is not a text channel.`);
                return;
            }
            if (typeof (channel as any).send !== "function") {
                console.error(`[DiscordNotifyHandler] Cannot send message in channel (${channelId}).`);
                return;
            }
            (channel as TextChannel).send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            }).catch((err: any) => {
                console.error(`[DiscordNotifyHandler] Failed to send message to channel (${channelId}):`, err);
            });
        });
    }
}