import { execa } from "execa";
import * as fs from "fs";
import * as yauzl from "yauzl";
import * as path from "path";

export class WhatsNewUtil {
  static async init() {
    if (!fs.existsSync("./data/tmp")) {
      fs.mkdirSync("./data/tmp", { recursive: true });
    }
  }

  static async getWhatsNew(
    url: string,
    version: string | undefined,
  ): Promise<string> {
    await this.init();

    await execa("curl", ["-OL", url], { cwd: "./data/tmp" });
    await this.extractZip(
      `./data/tmp/aviutl2${version}.zip`,
      `./data/tmp/aviutl2${version}`,
    );

    const txt = fs.readFileSync(
      `./data/tmp/aviutl2${version}/aviutl2.txt`,
      "utf-8",
    );
    fs.unlinkSync(`./data/tmp/aviutl2${version}.zip`);
    fs.rmSync(`./data/tmp/aviutl2${version}`, { recursive: true, force: true });
    const lines = txt.replace(/\r\n/g, "\n").split("\n");

    const pattern = new RegExp(
      `^\\[\\d{4}/\\d{1,2}/\\d{1,2}\\]\\s+ver\\s+2\\.?\\d*\\s+${version}$`,
      "i",
    );
    const lineNum = lines.findIndex((line) => pattern.test(line.trim()));

    if (lineNum === -1) {
      return `バージョン ${version} の情報が見つかりませんでした。`;
    }

    const resultLines = lines.slice(lineNum).map((line) => line.trim());

    const latest = {
      version: version,
      date:
        resultLines[0].match(/\[(\d{4}\/\d{1,2}\/\d{1,2})\]/)?.[1] || "不明",
      info: resultLines.join("\n"),
    };

    if (!fs.existsSync("./data")) {
      fs.mkdirSync("./data", { recursive: true });
    }

    fs.writeFileSync("./data/latest.json", JSON.stringify(latest, null, 2));

    return resultLines.join("\n");
  }

  static async getFromFile(): Promise<{
    version: string;
    date: string;
    info: string;
  }> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync("./data/latest.json")) {
        reject(new Error("latest.json does not exist"));
      }
      const data = fs.readFileSync("./data/latest.json", "utf-8");
      const latest = JSON.parse(data);
      resolve({
        version: latest.version,
        date: latest.date,
        info: latest.info,
      });
    });
  }

  private static extractZip(
    zipPath: string,
    extractPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);
        if (!fs.existsSync(extractPath))
          fs.mkdirSync(extractPath, { recursive: true });
        zipfile!.readEntry();
        zipfile!.on("entry", (entry) => {
          const entryPath = path.join(extractPath, entry.fileName);
          if (/\/$/.test(entry.fileName)) {
            fs.mkdirSync(entryPath, { recursive: true });
            zipfile!.readEntry();
          } else {
            zipfile!.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err);
              fs.mkdirSync(path.dirname(entryPath), { recursive: true });
              readStream!.pipe(fs.createWriteStream(entryPath));
              readStream!.on("end", () => zipfile!.readEntry());
            });
          }
        });
        zipfile!.on("end", () => {
          zipfile!.close();
          resolve();
        });
      });
    });
  }
}
