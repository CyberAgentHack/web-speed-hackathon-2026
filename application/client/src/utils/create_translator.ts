import langs from "langs";
import invariant from "tiny-invariant";

import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * サーバーサイド翻訳APIを使用するTranslatorを生成する。
 * 元のWeb LLM（数GB）をサーバーAPIに置換し、パフォーマンスと信頼性を改善。
 */
export async function createTranslator(params: Params): Promise<Translator> {
  const sourceLang = langs.where("1", params.sourceLanguage);
  invariant(sourceLang, `Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  invariant(targetLang, `Unsupported target language code: ${params.targetLanguage}`);

  return {
    async translate(text: string): Promise<string> {
      const response = await sendJSON<{ result: string }>("/api/v1/translate", {
        text,
        targetLanguage: params.targetLanguage,
      });
      return response.result;
    },
    [Symbol.dispose]: () => {
      // サーバーAPI方式のためクリーンアップ不要
    },
  };
}
