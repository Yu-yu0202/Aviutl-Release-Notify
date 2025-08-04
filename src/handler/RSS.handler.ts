import axios from "axios";
import iconv from "iconv-lite";
import { load } from "cheerio";
import { create } from "xmlbuilder2";

export class RSSHandler {
    public static async createRSS(URL: string): Promise<string> {
        const response = await axios.get<ArrayBuffer>(URL, {
            responseType: "arraybuffer",
        });
        const decoded = iconv.decode(Buffer.from(response.data), "utf-8");
        const $ = load(decoded);
        const items = $("table")
        const target = items.eq(5);
        const item: { title: string; date: string}[] = [];

        target.find("td").each((_, td) => {
            const text = $(td).text().trim();
            const dateMatch = text.match(/^(\d{4}\/\d{2}\/\d{2})(.*)/);
            if (dateMatch) {
                const [, date, title] = dateMatch;
                item.push({
                    date,
                    title: title.trim() || "No title"
                });
            }
        });

        const feed = create({ version: "1.0", encoding: "UTF-8" })
        .ele("rss", { version: "2.0" })
        .ele("channel")
        .ele("title").txt("AviUtl 更新情報").up()
        .ele("link").txt(URL).up()
        .ele("description").txt("AviUtl 更新情報").up();

        for (const _item of item) {
            feed
                .ele("item")
                .ele("title").txt(_item.title).up()
                .ele("link").txt(URL).up()
                .ele("pubDate").txt(new Date(_item.date).toUTCString()).up()
                .up();
        }
    
        return feed.end({ prettyPrint: true });
    }
}