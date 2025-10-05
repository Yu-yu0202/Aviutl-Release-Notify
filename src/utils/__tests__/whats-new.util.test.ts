import { jest } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { WhatsNewUtil } from "../whats-new.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

jest.mock("execa");

describe("WhatsNewUtil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync("./data/tmp/test-extracted")) {
      fs.rmSync("./data/tmp/test-extracted", { recursive: true, force: true });
    }
  });

  describe("init", () => {
    it("should create tmp directory if it does not exist", async () => {
      if (fs.existsSync("./data/tmp")) {
        fs.rmSync("./data/tmp", { recursive: true, force: true });
      }

      await WhatsNewUtil.init();

      expect(fs.existsSync("./data/tmp")).toBe(true);
    });

    it("should not throw error if tmp directory already exists", async () => {
      await WhatsNewUtil.init();
      await expect(WhatsNewUtil.init()).resolves.not.toThrow();
    });
  });

  describe("getUtl2", () => {
    it("should parse actual aviutl2.txt and return version information", async () => {
      const version = "beta14";
      const testDir = `./data/tmp/aviutl2${version}`;
      const testFile = `${testDir}/aviutl2.txt`;
      
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.copyFileSync(path.join(__dirname, "aviutl2.txt"), testFile);

      const result = await (WhatsNewUtil as any).getUtl2(version);

      expect(result).toContain("ver 2.00 beta14");
      expect(result).toContain("部分フィルタと組み合わせが出来ないフィルタ");
    });

    it("should return error message when version not found in actual file", async () => {
      const version = "nonexistent";
      const testDir = `./data/tmp/aviutl2${version}`;
      const testFile = `${testDir}/aviutl2.txt`;
      
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.copyFileSync(path.join(__dirname, "aviutl2.txt"), testFile);

      const result = await (WhatsNewUtil as any).getUtl2(version);

      expect(result).toBe("バージョン nonexistent の情報が見つかりませんでした。");
    });

    afterEach(() => {
      if (fs.existsSync("./data/tmp/aviutl2beta14")) {
        fs.rmSync("./data/tmp/aviutl2beta14", { recursive: true, force: true });
      }
      if (fs.existsSync("./data/tmp/aviutl2nonexistent")) {
        fs.rmSync("./data/tmp/aviutl2nonexistent", { recursive: true, force: true });
      }
    });
  });

  describe("getLua", () => {
    it("should parse actual lua.txt and return version information", async () => {
      const version = "beta14";
      const testDir = `./data/tmp/aviutl2${version}`;
      const testFile = `${testDir}/lua.txt`;
      
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.copyFileSync(path.join(__dirname, "lua.txt"), testFile);

      const result = await (WhatsNewUtil as any).getLua(version);

      expect(result).toContain("ver 2.00 beta2");
      expect(result).toContain("copybuffer()のコピー先種別を追加");
    });

    it("should return error message when no date pattern found in actual file", async () => {
      const version = "beta14";
      const testDir = `./data/tmp/aviutl2${version}`;
      const testFile = `${testDir}/lua.txt`;
      
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.writeFileSync(testFile, "No date pattern here\nJust some content");

      const result = await (WhatsNewUtil as any).getLua(version);

      expect(result).toBe("バージョン beta14 の情報が見つかりませんでした。");
    });

    it("should handle empty lines correctly with actual file", async () => {
      const version = "beta14";
      const testDir = `./data/tmp/aviutl2${version}`;
      const testFile = `${testDir}/lua.txt`;
      
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      fs.copyFileSync(path.join(__dirname, "lua.txt"), testFile);

      const result = await (WhatsNewUtil as any).getLua(version);

      expect(result).toContain("ver 2.00 beta2");
      expect(result).toContain("copybuffer()のコピー先種別を追加");
    });

    afterEach(() => {
      if (fs.existsSync("./data/tmp/aviutl2beta14")) {
        fs.rmSync("./data/tmp/aviutl2beta14", { recursive: true, force: true });
      }
    });
  });

  describe("getFromFile", () => {
    beforeEach(() => {
      if (fs.existsSync("./data/latest.json")) {
        fs.unlinkSync("./data/latest.json");
      }
    });

    it("should return data from latest.json file", async () => {
      const mockData = {
        version: "1.0.0",
        date: "2024/01/01",
        aviutl2: "AviUtl2 changelog",
        lua: "Lua changelog",
      };

      if (!fs.existsSync("./data")) {
        fs.mkdirSync("./data", { recursive: true });
      }
      fs.writeFileSync("./data/latest.json", JSON.stringify(mockData));

      const result = await WhatsNewUtil.getFromFile();

      expect(result).toEqual(mockData);
    });

    it("should throw error when latest.json does not exist", async () => {
      await expect(WhatsNewUtil.getFromFile()).rejects.toThrow(
        "latest.json does not exist",
      );
    });

    it("should throw error when JSON is invalid", async () => {
      if (!fs.existsSync("./data")) {
        fs.mkdirSync("./data", { recursive: true });
      }
      fs.writeFileSync("./data/latest.json", "invalid json");

      await expect(WhatsNewUtil.getFromFile()).rejects.toThrow();
    });
  });

  describe("extractZip", () => {
    it("should extract zip file successfully", async () => {
      const testZipPath = path.join(__dirname, "aviutl2beta14.zip");
      const testExtractPath = "./data/tmp/test-extracted";

      await expect(
        (WhatsNewUtil as any).extractZip(testZipPath, testExtractPath),
      ).resolves.toBeUndefined();

      expect(fs.existsSync(testExtractPath)).toBe(true);
    });

    it("should handle zip extraction error for non-existent file", async () => {
      const nonExistentZipPath = "./data/tmp/non-existent.zip";
      const testExtractPath = "./data/tmp/test-extracted";

      await expect(
        (WhatsNewUtil as any).extractZip(nonExistentZipPath, testExtractPath),
      ).rejects.toThrow();
    });
  });
});
