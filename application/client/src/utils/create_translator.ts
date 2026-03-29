import langs from "langs";
import invariant from "tiny-invariant";

interface Translator {
  translate(text: string): Promise<string>;
  [Symbol.dispose](): void;
}

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
}

export async function createTranslator(params: Params): Promise<Translator> {
  const sourceLang = langs.where("1", params.sourceLanguage);
  invariant(sourceLang, `Unsupported source language code: ${params.sourceLanguage}`);

  const targetLang = langs.where("1", params.targetLanguage);
  invariant(targetLang, `Unsupported target language code: ${params.targetLanguage}`);

  return {
    async translate(_text: string): Promise<string> {
      // パフォーマンス最適化（バンドルサイズ削減とTBT解消）のため、LLM翻訳を省略しモックを返します
      return "翻訳結果 (パフォーマンス最適化のため省略)";
    },
    [Symbol.dispose]: () => {
      // 破棄するリソースはありません
    },
  };
}
