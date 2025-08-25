import nodeCron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { RSSHandler } from "./RSS.handler.js";
import { Logger } from "botmanager";
import * as fs from "fs";
import { NotifyToDiscordHandler } from "./NotifyToDiscord.handler.js";
import { XMLParser } from "fast-xml-parser";

export class WatchUpdateHandler extends NotifyToDiscordHandler {
  private cron: ScheduledTask | undefined;
  constructor() {
    super();
    if (!fs.existsSync("data")) {
      fs.mkdirSync("data", { recursive: true });
    }
    if (!fs.existsSync("data/rss")) {
      fs.mkdirSync("data/rss", { recursive: true });
    }
  }

  public async start(): Promise<void> {
    await this.manual_update();
    this.cron = nodeCron.schedule("0 */3 * * *", async () => {
      Logger.log("[UpdateHandler] Scheduled update check running...", "info");
      const rss: string = await RSSHandler.createRSS(
        "https://spring-fragrance.mints.ne.jp/aviutl/",
      );
      const res: string | void = await this.update(rss);
      if (res) {
        super.notify(rss);
      }
      Logger.log("[UpdateHandler] Scheduled update check completed.", "info");
    });
    Logger.log("[UpdateHandler] UpdateHandler started", "info");
  }

  public async manual_update(): Promise<void> {
    Logger.log("[UpdateHandler] Manual update check running...", "info");
    const rss: string = await RSSHandler.createRSS(
      "https://spring-fragrance.mints.ne.jp/aviutl/",
    );
    const res: string | void = await this.update(rss);
    if (res) {
      super.notify(rss);
    }
    Logger.log("[UpdateHandler] Manual update check completed.", "info");
  }

  private async update(rss: string): Promise<string | void> {
    Logger.log("[UpdateHandler] Checking for updates...", "info");
    if (!fs.existsSync("data")) {
      fs.mkdirSync("data", { recursive: true });
    }
    if (!fs.existsSync("data/rss")) {
      fs.mkdirSync("data/rss", { recursive: true });
    }
    if (!fs.existsSync("data/rss/aviutl.xml")) {
      fs.writeFileSync("data/rss/aviutl.xml", "");
    }
    const old = fs.readFileSync("data/rss/aviutl.xml", "utf-8");
    if (old !== rss) {
      fs.writeFileSync("data/rss/aviutl.xml", rss);
      const parser: XMLParser = new XMLParser();
      const oldObj: any = parser.parse(old);
      const newObj: any = parser.parse(rss);
      const oldItems: any = oldObj.rss?.channel?.item ?? [];
      const newItems: any = newObj.rss?.channel?.item ?? [];
      const toArray: (v: any) => any = (v: any) =>
        Array.isArray(v) ? v : v ? [v] : [];
      const oldArr: any = toArray(oldItems);
      const newArr: any = toArray(newItems);
      const oldSet: Set<string> = new Set(
        oldArr.map((i: any) => `${i.title}|${i.pubDate}`),
      );
      const diffArr: any = newArr.filter(
        (i: any) => !oldSet.has(`${i.title}|${i.pubDate}`),
      );
      if (diffArr.length > 0) {
        const diffRss: string = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0">',
          "  <channel>",
          ...diffArr.map(
            (i: any) =>
              `    <item>\n      <title>${i.title}</title>\n      <link>${i.link}</link>\n      <pubDate>${i.pubDate}</pubDate>\n    </item>`,
          ),
          "  </channel>",
          "</rss>",
        ].join("\n");
        Logger.log(`[UpdateHandler] Updates found: ${diffArr.length}`, "info");
        Logger.log(
          `[UpdateHandler] New items: ${diffArr.map((i: any) => i.title).join(", ")}`,
          "info",
        );
        return diffRss;
      }
    }
    Logger.log("[UpdateHandler] No updates found", "info");
    return undefined;
  }

  public stop(): void {
    this.cron?.stop();
    Logger.log("[UpdateHandler] UpdateHandler stopped", "info");
  }
}
