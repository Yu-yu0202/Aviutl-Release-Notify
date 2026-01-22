import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import nodeCron, { type ScheduledTask } from "node-cron";
import yauzl from "yauzl";
import { CheerioAPI, load } from "cheerio";
import { Logger } from "diskernel";
import { Aviutl2Release } from "../database/schema/aviutl2Release.js";
import { SdkRelease } from "../database/schema/sdkRelease.js";
import { NotifyBuilder } from "./notifyBuilder.js";
import { NotifyToDiscord } from "./notifyToDiscord.js";

const logger = Logger("ReleaseInfo");

async function getURLContent(url: string): Promise<string>;
async function getURLContent(url: string, outputPath: string): Promise<void>;
async function getURLContent(
  url: string,
  outputPath?: string,
): Promise<string | void> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`status code isn't 200: ${res.statusCode}`));
        res.resume();
        return;
      }
      if (outputPath) {
        const fileStream = fs.createWriteStream(path.resolve(outputPath));
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      } else {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
      }
    });
  });
}

function isUpdated(
  checkData: { date: Date; version?: string },
  lastData: { date: Date; version?: string },
): boolean {
  return (
    checkData.date > lastData.date &&
    !!checkData.version &&
    !!lastData.version &&
    checkData.version !== lastData.version
  );
}

export class ReleaseInfo {
  private static cron: ScheduledTask | undefined;

  private static getNoteFromPattern(
    lines: string[],
    pattern: RegExp,
    lineFirstCharacter: string,
  ): string | null {
    const lineNum = lines.findIndex((line) => pattern.test(line.trim()));
    if (lineNum === -1) {
      return null;
    }

    const resultLines = lines.slice(lineNum);
    const endLineNum =
      resultLines
        .slice(1)
        .findIndex((line) => line.startsWith(lineFirstCharacter)) !== -1
        ? 1 +
          resultLines
            .slice(1)
            .findIndex((line) => line.startsWith(lineFirstCharacter))
        : resultLines.length;

    return resultLines.slice(0, endLineNum).join("\n");
  }

  private static async getAviUtl2ReleaseNote(
    url: string,
    version: string,
    lineFirstCharacter: string,
  ): Promise<string | null> {
    await using tmpDir = await fs.promises.mkdtempDisposable("arn-");
    const zipFilePath = path.join(tmpDir.path, `aviutl2.zip`);

    await getURLContent(url, zipFilePath).catch((err: Error) => {
      logger.error(`Failed to download zip file: ${err.message}`);
    });

    return new Promise<string | null>((resolve, _reject) => {
      yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) {
          logger.error(`Failed to open zip file: ${err?.message}`);
          return resolve(null);
        }
        let fileContent = "";
        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          if (entry.fileName === "aviutl2.txt") {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err || !readStream) {
                logger.error(
                  `Failed to read entry aviutl2.txt from zip: ${err?.message}`,
                );
                zipfile.readEntry();
                return resolve(null);
              }
              readStream.on("data", (chunk) => {
                fileContent += chunk;
              });
              readStream.on("end", () => {
                const lines = fileContent.replace(/\r\n/g, "\n").split("\n");
                const pattern = new RegExp(
                  `^\\[\\d{4}/\\d{1,2}/\\d{1,2}\\]\\s+ver\\s+2\\.?\\d*\\s+${version}$`,
                  "i",
                );
                const releaseNote =
                  this.getNoteFromPattern(lines, pattern, lineFirstCharacter) ||
                  `バージョン ${version} の情報が見つかりませんでした。`;
                resolve(releaseNote.replace(/^\s+/gm, ""));
              });
            });
          } else {
            zipfile.readEntry();
          }
        });
      });
    });
  }

  private static async getLuaReleaseNote(
    url: string,
    date: Date,
    lineFirstCharacter: string,
  ): Promise<string | null> {
    await using tmpDir = await fs.promises.mkdtempDisposable("arn-");
    const zipFilePath = path.join(tmpDir.path, `aviutl2.zip`);

    await getURLContent(url, zipFilePath).catch((err: Error) => {
      logger.error(`Failed to download zip file: ${err.message}`);
    });

    return new Promise<string | null>((resolve, _reject) => {
      yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) {
          logger.error(`Failed to open zip file: ${err?.message}`);
          return resolve(null);
        }
        let fileContent = "";
        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          if (entry.fileName === "lua.txt") {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err || !readStream) {
                logger.error(
                  `Failed to read entry lua.txt from zip: ${err?.message}`,
                );
                zipfile.readEntry();
                return resolve(null);
              }
              readStream.on("data", (chunk) => {
                fileContent += chunk;
              });
              readStream.on("end", () => {
                const lines = fileContent
                  .replace(/\r\n/g, "\n")
                  .split("\n")
                  .map((line) => line.trim());
                const dateString = date
                  .toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
                  .split("/")
                  .map((str) => {
                    if (str.startsWith("0")) str = str.substring(1);
                    return str;
                  })
                  .join("/");
                const pattern = new RegExp(`^\\[${dateString}]`, "i");
                const releaseNote = this.getNoteFromPattern(
                  lines,
                  pattern,
                  lineFirstCharacter,
                );
                resolve(
                  releaseNote
                    ?.replace(/(\r?\n){2,}[\s\S]*/g, "")
                    .replace(/^\s+/gm, "") ?? null,
                );
              });
            });
          } else {
            zipfile.readEntry();
          }
        });
      });
    });
  }

  private static async getSDKReleaseNote(
    url: string,
    date: Date,
    lineFirstCharacter: string,
  ): Promise<string | null> {
    await using tmpDir = await fs.promises.mkdtempDisposable("arn-");
    const zipFilePath = path.join(tmpDir.path, `aviutl2_sdk.zip`);

    await getURLContent(url, zipFilePath).catch((err: Error) => {
      logger.error(`Failed to download SDK zip file: ${err.message}`);
    });

    return new Promise<string | null>((resolve, _reject) => {
      yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) {
          logger.error(`Failed to open SDK zip file: ${err?.message}`);
          return resolve(null);
        }
        let fileContent = "";
        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          if (entry.fileName === "aviutl2_plugin_sdk.txt") {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err || !readStream) {
                logger.error(
                  `Failed to read entry aviutl2_plugin_sdk.txt from zip: ${err?.message}`,
                );
                zipfile.readEntry();
                return resolve(null);
              }
              readStream.on("data", (chunk) => {
                fileContent += chunk;
              });
              readStream.on("end", () => {
                const lines = fileContent.replace(/\r\n/g, "\n").split("\n");
                const dateString = date
                  .toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
                  .split("/")
                  .map((str) => {
                    if (str.startsWith("0")) str = str.substring(1);
                    return str;
                  })
                  .join("/");
                const pattern = new RegExp(`^\\[${dateString}]`, "i");
                const releaseNote = this.getNoteFromPattern(
                  lines,
                  pattern,
                  lineFirstCharacter,
                );
                resolve(releaseNote?.replace(/^\s+/gm, "") ?? null);
              });
            });
          } else {
            zipfile.readEntry();
          }
        });
      });
    });
  }

  private static async checkAviUtl2Update(): Promise<void> {
    const lastRelease = await Aviutl2Release.findOne()
      .sort({ releasedDate: -1 })
      .lean();

    const response: string | undefined = await getURLContent(
      "https://spring-fragrance.mints.ne.jp/aviutl/",
    ).catch((err: Error) => {
      logger.error(`Error fetching release info: ${err.message}`);
      return undefined;
    });

    if (!response) {
      return;
    }

    const $: CheerioAPI = load(response);
    const infomationTable = $("html > body > center > table")
      .eq(4)
      .find("tbody > tr > td")
      .eq(1)
      .find("table")
      .first();
    const fonts = infomationTable.find("tbody > tr > td > b > font").toArray();
    const dateText = $(fonts[0]).text().trim(); // yyyy/mm/dd（0埋めなし）
    const match = dateText.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);

    if (!match) {
      logger.warn("❌️ Invalid date string: checkAviUtl2Update()");
      return;
    }

    const [, y, m, d] = match;
    const releasedDate = new Date(
      Number(y),
      Number(m) - 1, // 月は0始まり
      Number(d),
    );

    const versionString = $(fonts[1])
      .text()
      .trim()
      .split("を公開")[0] // 「を公開」を捨てる
      .trim();
    const version = versionString.replace("AviUtl ExEdit2 ", "").trim();

    if (
      lastRelease &&
      !isUpdated(
        { date: releasedDate, version: version },
        { date: lastRelease.releasedDate, version: lastRelease._id },
      )
    ) {
      logger.info("✅️ No new AviUtl2 release detected.");
      return;
    }

    const exeUrl = `https://spring-fragrance.mints.ne.jp/aviutl/AviUtl2${version}_setup.exe`;
    const zipUrl = `https://spring-fragrance.mints.ne.jp/aviutl/aviutl2${version}.zip`;

    const aviutl2ReleaseNote =
      (await this.getAviUtl2ReleaseNote(zipUrl, version, "[")) ??
      "データの取得に失敗しました";

    const luaReleaseNote =
      (await this.getLuaReleaseNote(zipUrl, releasedDate, "[")) ??
      "データの取得に失敗しました";

    await Aviutl2Release.create({
      _id: version,
      zipUrl,
      exeUrl,
      releasedDate,
      aviutl2ReleaseNote,
      luaReleaseNote,
    });

    logger.info(`🎉 New AviUtl2 release detected: ${versionString}`);

    const notify = new NotifyBuilder("AviUtl2");

    notify.setAviUtl2Info({
      aviutl2Version: versionString,
      aviutl2ReleaseNote,
      luaReleaseNote,
      zipUrl,
      exeUrl,
    });

    NotifyToDiscord.notify(notify).catch((err) => {
      logger.error(
        "❌️ Failed to notify to Discord(checkAviUtl2Update): {err}",
        {
          err: err instanceof Error ? err.message : err.toString(),
        },
      );
    });
  }

  private static async checkSDKUpdate(): Promise<void> {
    const lastRelease = await SdkRelease.findOne().sort({ _id: -1 });

    const response: string | undefined = await getURLContent(
      "https://spring-fragrance.mints.ne.jp/aviutl/",
    ).catch((err: Error) => {
      logger.error(`Error fetching release info: ${err.message}`);
      return undefined;
    });

    if (!response) {
      logger.error("No response received at checkSDKUpdate()");
      return;
    }

    const $: CheerioAPI = load(response);
    const sdkDate = $("html > body > center > div > table")
      .eq(0)
      .find("tbody > tr")
      .eq(0)
      .find("td > table > tbody > tr")
      .eq(4)
      .find("td")
      .eq(2)
      .text()
      .trim();
    const match = sdkDate.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);

    if (!match) {
      logger.warn("❌️ Invalid date string: checkAviUtl2Update()");
      return;
    }

    const [, y, m, d] = match;
    const sdkParsedDate = new Date(
      Number(y),
      Number(m) - 1, // 月は0始まり
      Number(d),
    );

    if (
      lastRelease &&
      !isUpdated({ date: sdkParsedDate }, { date: lastRelease._id })
    ) {
      logger.info("✅️ No new SDK release detected.");
      return;
    }

    const sdkUrl = `https://spring-fragrance.mints.ne.jp/aviutl/aviutl2_sdk.zip`;
    const releaseNote =
      (await this.getSDKReleaseNote(sdkUrl, sdkParsedDate, "[")) ??
      "データの取得に失敗しました";

    await SdkRelease.create({
      _id: sdkParsedDate,
      releaseNote,
    });

    logger.info(
      `🎉 New AviUtl2 SDK release detected: releasedDate ${sdkParsedDate}`,
    );

    const notify = new NotifyBuilder("SDK");

    notify.setSDKInfo({
      sdkReleaseNote: releaseNote,
    });

    NotifyToDiscord.notify(notify).catch((err) => {
      logger.error("❌️ Failed to notify to Discord(checkSDKUpdate): {err}", {
        err: err instanceof Error ? err.message : err.toString(),
      });
    });
  }

  public static async deleteAviUtl2ReleaseData(): Promise<void> {
    try {
      await Aviutl2Release.deleteMany({});
    } catch (e: any) {
      logger.warn("Error deleting release info: {m}", {
        m: e instanceof Error ? e.message : e.toString(),
      });
    }
  }

  public static async deleteSDKReleaseData(): Promise<void> {
    try {
      await SdkRelease.deleteMany({});
    } catch (e: any) {
      logger.warn("Error deleting release info: {m}", {
        m: e instanceof Error ? e.message : e.toString(),
      });
    }
  }

  public static async cronJob(): Promise<void> {
    logger.info("🚀 Cron job started");

    await this.checkAviUtl2Update();

    await this.checkSDKUpdate();

    logger.info("✅️ Cron job finished");
  }

  public static async init(): Promise<void> {
    await this.cronJob();
    nodeCron.schedule("0 */3 * * *", this.cronJob);
  }
}
