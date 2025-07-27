import nodeCron from "node-cron";
import { RSSHandler } from "./RSSHandler.js";
import * as fs from "fs";
import { DiscordNotifyHandler } from "./DiscordNotifyHandler.js";
import { XMLParser } from 'fast-xml-parser';
export class UpdateHandler extends DiscordNotifyHandler {
    cron;
    constructor(client, channelId) {
        super(client, channelId);
        if (!fs.existsSync("rss")) {
            fs.mkdirSync("rss");
        }
    }
    async start() {
        await this.manual_update();
        this.cron = nodeCron.schedule("* 6 * * *", async () => {
            console.info('[UpdateHandler] Scheduled update check running...');
            const rss = await RSSHandler.createRSS("https://spring-fragrance.mints.ne.jp/aviutl/");
            const res = await this.update(rss);
            if (res) {
                super.notify(rss);
            }
            console.info('[UpdateHandler] Scheduled update check completed.');
        });
        console.info('[UpdateHandler] UpdateHandler started');
    }
    async manual_update() {
        console.info('[UpdateHandler] Manual update check running...');
        const rss = await RSSHandler.createRSS("https://spring-fragrance.mints.ne.jp/aviutl/");
        const res = await this.update(rss);
        if (res) {
            super.notify(rss);
        }
        console.info('[UpdateHandler] Manual update check completed.');
    }
    async update(rss) {
        console.info('[UpdateHandler] Checking for updates...');
        if (!fs.existsSync("rss/aviutl.xml")) {
            fs.writeFileSync("rss/aviutl.xml", rss);
        }
        const old = fs.readFileSync("rss/aviutl.xml", "utf-8");
        if (old !== rss) {
            fs.writeFileSync("rss/aviutl.xml", rss);
            const parser = new XMLParser();
            const oldObj = parser.parse(old);
            const newObj = parser.parse(rss);
            const oldItems = (oldObj.rss?.channel?.item ?? []);
            const newItems = (newObj.rss?.channel?.item ?? []);
            const toArray = (v) => Array.isArray(v) ? v : v ? [v] : [];
            const oldArr = toArray(oldItems);
            const newArr = toArray(newItems);
            const oldSet = new Set(oldArr.map((i) => `${i.title}|${i.pubDate}`));
            const diffArr = newArr.filter((i) => !oldSet.has(`${i.title}|${i.pubDate}`));
            if (diffArr.length > 0) {
                const diffRss = [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<rss version="2.0">',
                    '  <channel>',
                    ...diffArr.map((i) => `    <item>\n      <title>${i.title}</title>\n      <link>${i.link}</link>\n      <pubDate>${i.pubDate}</pubDate>\n    </item>`),
                    '  </channel>',
                    '</rss>'
                ].join('\n');
                console.info('[UpdateHandler] Updates found:', diffArr.length);
                console.info('[UpdateHandler] New items:', diffArr.map((i) => i.title).join(', '));
                return diffRss;
            }
        }
        console.info('[UpdateHandler] No updates found');
        return undefined;
    }
    stop() {
        this.cron?.stop();
        console.info('[UpdateHandler] UpdateHandler stopped');
    }
}
