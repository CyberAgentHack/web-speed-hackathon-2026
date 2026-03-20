import { stripIndents } from "common-tags";

import type { Writer } from "../writer/writer";

type AreaKey = "scoreTable" | "errorList" | "result" | "fatalError";

type Options = {
  writer: Writer;
};

export class Reporter {
  private _options: Options;
  private _state = new Map<AreaKey, string[]>();

  constructor(options: Options) {
    this._options = options;
  }

  setArea(key: AreaKey, value: string) {
    this._state.set(key, [value]);
    return this._update();
  }

  appendArea(key: AreaKey, value: string) {
    const current = this._state.get(key) ?? [];
    this._state.set(key, [...current, value]);
    return this._update();
  }

  async initialize() {
    await this._options.writer.initialize();
    await this._update();
  }

  private get _body(): string {
    if (this._state.has("fatalError")) {
      return stripIndents`
        # 🚀 **Web Speed Hackathon 2026 へようこそ！**

        ${this._state.get("fatalError")?.join("\n") ?? ""}
      `;
    }

    if (this._state.has("result")) {
      return stripIndents`
        # 🚀 **Web Speed Hackathon 2026 へようこそ！**

        ### スコア

        ${this._state.get("scoreTable")?.join("\n") ?? ""}

        ${this._state.get("result")?.join("\n") ?? ""}

        ### 計測できなかった原因

        ${this._state.get("errorList")?.join("\n") ?? "問題なく計測されました"}
      `;
    } else {
      return stripIndents`
        # 🚀 **Web Speed Hackathon 2026 へようこそ！**

        ### スコア

        ${this._state.get("scoreTable")?.join("\n") ?? "⏳ 計測しています..."}

        ${this._state.get("result")?.join("\n") ?? ""}

        ### 計測できなかった原因

        ${this._state.get("errorList")?.join("\n") ?? "⏳ 順調に計測が進んでいます"}

        ---

        ⏳ 計測しています...
        ⚠️ 計測には最大 20 分かかります、計測中はデプロイしないでください
      `;
    }
  }

  private async _update() {
    await this._options.writer.update(this._body);
  }
}
