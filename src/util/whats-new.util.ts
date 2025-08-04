import { execa } from "execa";
import * as fs from "fs";
import * as yauzl from "yauzl";
import * as path from "path";

export class WhatsNewUtil {
    static async init() {
        if (!fs.existsSync("./tmp")) {
            fs.mkdirSync("./tmp");
        }
    }

    static async getWhatsNew(url: string, version: string | undefined) {
        await execa("curl", ["-OL", url], { cwd: "./tmp" });
        await this.extractZip(`./tmp/aviutl2${version}.zip`, `./tmp/aviutl2${version}`);
    
        const txt = fs.readFileSync(`./tmp/aviutl2${version}/aviutl2.txt`, "utf-8");
        fs.unlinkSync(`./tmp/aviutl2${version}.zip`);
        fs.rmSync(`./tmp/aviutl2${version}`, { recursive: true, force: true });
        const lines = txt.replace(/\r\n/g, "\n").split("\n");
    
        const pattern = new RegExp(
            `^\\[\\d{4}/\\d{1,2}/\\d{1,2}\\]\\s+ver\\s+2\\.?\\d*\\s+${version}$`, "i"
        );
        const lineNum = lines.findIndex(line => pattern.test(line.trim()));
    
        if (lineNum === -1) {
            return `バージョン ${version} の情報が見つかりませんでした。`;
        }
    
        const resultLines = lines.slice(lineNum).map(line => line.trim());
        return resultLines.join("\n");
    }    

    private static extractZip(zipPath: string, extractPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            yauzl.open(zipPath, {lazyEntries: true}, (err, zipfile) => {
                if (err) return reject(err);
                if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, {recursive: true});
                zipfile!.readEntry();
                zipfile!.on("entry", (entry) => {
                    const entryPath = path.join(extractPath, entry.fileName);
                    if (/\/$/.test(entry.fileName)) {
                        fs.mkdirSync(entryPath, {recursive: true});
                        zipfile!.readEntry();
                    } else {
                        zipfile!.openReadStream(entry, (err, readStream) => {
                            if (err) return reject(err);
                            fs.mkdirSync(path.dirname(entryPath), {recursive: true});
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