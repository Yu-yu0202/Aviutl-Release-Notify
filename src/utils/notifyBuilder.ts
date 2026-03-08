import {
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import pkg from "../../package.json" with { type: "json" };

export class NotifyBuilder {
  private data:
    | {
        type: "AviUtl2";
        aviutl2Version: string;
        aviutl2ReleaseNote: string;
        luaReleaseNote: string;
        zipUrl: string;
        exeUrl: string;
      }
    | {
        type: "SDK";
        sdkReleaseNote: string;
      };

  constructor(type: NotifyBuilder["data"]["type"]) {
    if (type === "AviUtl2") {
      this.data = {
        type: "AviUtl2",
        aviutl2Version: "",
        aviutl2ReleaseNote: "",
        luaReleaseNote: "",
        zipUrl: "",
        exeUrl: "",
      };
    } else {
      this.data = {
        type: "SDK",
        sdkReleaseNote: "",
      };
    }
  }

  public setAviUtl2Info(
    info: Omit<Extract<NotifyBuilder["data"], { type: "AviUtl2" }>, "type">,
  ): NotifyBuilder {
    if (this.data.type !== "AviUtl2") {
      throw new Error("Invalid type for setAviUtl2Info()");
    }
    this.data.aviutl2Version =
      info.aviutl2Version ?? (this.data.aviutl2Version || "");
    this.data.aviutl2ReleaseNote =
      info.aviutl2ReleaseNote ?? (this.data.aviutl2ReleaseNote || "");
    this.data.luaReleaseNote =
      info.luaReleaseNote ?? (this.data.luaReleaseNote || "");
    this.data.zipUrl = info.zipUrl ?? (this.data.zipUrl || "");
    this.data.exeUrl = info.exeUrl ?? (this.data.exeUrl || "");
    return this;
  }

  public setSDKInfo(
    info: Omit<Extract<NotifyBuilder["data"], { type: "SDK" }>, "type">,
  ): NotifyBuilder {
    if (this.data.type !== "SDK") {
      throw new Error("Invalid type for setSDKInfo()");
    }
    this.data.sdkReleaseNote =
      info.sdkReleaseNote ?? (this.data.sdkReleaseNote || "");
    return this;
  }

  public toComponentsV2(): ContainerBuilder {
    const container: ContainerBuilder = new ContainerBuilder();

    if (this.data.type === "AviUtl2") {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${this.data.aviutl2Version} が公開されました！`,
        ),
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`更新点(aviutl2.txtから抜粋):`),
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `\`\`\`plaintext\n${this.data.aviutl2ReleaseNote}\n\`\`\``,
        ),
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`更新点(lua.txtから抜粋):`),
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `\`\`\`plaintext\n${this.data.luaReleaseNote}\n\`\`\``,
        ),
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${this.data.aviutl2Version} のダウンロードリンク`,
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
              .setURL(this.data.exeUrl)
              .setStyle(ButtonStyle.Link),
          ),
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`Zip版:`),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setLabel("ダウンロード")
              .setURL(this.data.zipUrl)
              .setStyle(ButtonStyle.Link),
          ),
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`AviUtlのお部屋:`),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setLabel("開く")
              .setURL("https://spring-fragrance.mints.ne.jp/aviutl/")
              .setStyle(ButtonStyle.Link),
          ),
      );
    } else if (this.data.type === "SDK") {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### AviUtl ExEdit2 Plugin SDKが更新されました！`,
        ),
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `更新点(aviutl2_plugin_sdk.txtから抜粋):`,
        ),
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `\`\`\`plaintext\n${this.data.sdkReleaseNote}\n\`\`\``,
        ),
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
      );
      container.addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`AviUtlのお部屋:`),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setLabel("開く")
              .setURL("https://spring-fragrance.mints.ne.jp/aviutl/")
              .setStyle(ButtonStyle.Link),
          ),
      );
    }

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
        `-# [AviUtl2 Release Notify v${pkg.version}](<https://discord.com/oauth2/authorize?client_id=1416628772710645851>) by Yu-yu0202`,
      ),
    );

    return container;
  }
}
