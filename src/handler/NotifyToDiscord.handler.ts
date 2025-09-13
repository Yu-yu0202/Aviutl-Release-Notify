import { XMLParser } from "fast-xml-parser";
import {
  ButtonBuilder,
  ButtonStyle,
  Client,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  TextChannel,
} from "discord.js";
import pkg from "../../package.json" with { type: "json" };
import { WhatsNewUtil } from "../utils/whats-new.util.js";
import { BotManager, DatabaseManager, Logger } from "botmanager";

interface channelIds {
  channelId: string;
}

export class NotifyToDiscordHandler {
  private client: Client;
  constructor() {
    this.client = BotManager.getClient();
  }
  public async notify(raw_rss: string): Promise<void> {
    const DB: DatabaseManager = new DatabaseManager();
    const rows: channelIds[] =
      ((await DB.query("SELECT channelId FROM channelIds")) as channelIds[]) ??
      [];
    DB.close();
    const parser: XMLParser = new XMLParser();
    const rss: any = parser.parse(raw_rss);
    const message: string =
      rss.rss?.channel?.item?.title.split("を")?.[0] + "が公開されました！";
    const title: string[] = rss.rss?.channel?.item?.title.split(" ");
    const downloadLink: { setup: string; zip: string } = {
      setup: `https://spring-fragrance.mints.ne.jp/aviutl/AviUtl2${String(title[2]).toLowerCase()}_setup.exe`,
      zip: `https://spring-fragrance.mints.ne.jp/aviutl/aviutl2${String(title[2]).toLowerCase()}.zip`,
    };
    const whatsNew: string = await WhatsNewUtil.getWhatsNew(
      downloadLink.zip,
      title[2].toLowerCase(),
    );
    const container: ContainerBuilder = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${message}`),
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${message}`),
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent("更新点(AviUtl2.txtから抜粋):"),
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`\`\`\`txt\n${whatsNew}\n\`\`\``),
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `AviUtl ${title[1] + " " + title[2]}のダウンロードリンク`,
      ),
    );
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`インストーラー版:`),
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setLabel("ダウンロード")
            .setURL(downloadLink.setup)
            .setStyle(ButtonStyle.Link),
        ),
      new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Zip版:`))
        .setButtonAccessory(
          new ButtonBuilder()
            .setLabel("ダウンロード")
            .setURL(downloadLink.zip)
            .setStyle(ButtonStyle.Link),
        ),
    );
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small),
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "-# このツールの使用により生じた問題は、作者は一切責任を負いません。\n-# 正確な情報を確認してください。",
      ),
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# [AviUtl Release Notify v${pkg.version}](<https://discord.com/oauth2/authorize?client_id=1396775484091662387>) by Yu-yu0202`,
      ),
    );

    rows.forEach((row) => {
      Logger.log(
        `[DiscordNotifyHandler] Sending message to channel (${row.channelId})...`,
        "info",
      );
      const channel = this.client?.channels.cache.get(row.channelId);
      if (!channel || !channel.isTextBased()) {
        Logger.log(
          `[DiscordNotifyHandler] Channel (${row.channelId}) not found or is not a text channel.`,
          "error",
        );
        return;
      }
      const textChannel = channel as TextChannel;
      textChannel
        .send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch((err: any) => {
          Logger.log(
            `[DiscordNotifyHandler] Failed to send message to channel (${row.channelId}): ${String(err)}`,
            "error",
          );
        });
    });
  }
}
