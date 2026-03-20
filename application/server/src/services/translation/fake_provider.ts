import {
  TranslateParams,
  TranslationProvider,
} from "@web-speed-hackathon-2026/server/src/services/translation/provider";

export class FakeTranslationProvider implements TranslationProvider {
  async translate(params: TranslateParams): Promise<string> {
    return `[${params.targetLanguage}] ${params.text}`;
  }
}
