import assert from "node:assert/strict";
import test from "node:test";

import {
  TranslateParams,
  TranslationProvider,
} from "@web-speed-hackathon-2026/server/src/services/translation/provider";
import { TranslationService } from "@web-speed-hackathon-2026/server/src/services/translation/service";

class CountingProvider implements TranslationProvider {
  count = 0;

  async translate(params: TranslateParams): Promise<string> {
    this.count += 1;
    return `[${params.targetLanguage}] ${params.text}`;
  }
}

test("TranslationService caches repeated translations", async () => {
  const provider = new CountingProvider();
  const service = new TranslationService({
    cacheMaxEntries: 10,
    cacheTtlMs: 60_000,
    provider,
  });

  const first = await service.translate({
    sourceLanguage: "ja",
    targetLanguage: "en",
    text: "こんにちは",
  });
  const second = await service.translate({
    sourceLanguage: "ja",
    targetLanguage: "en",
    text: "こんにちは",
  });

  assert.equal(first, "[en] こんにちは");
  assert.equal(second, "[en] こんにちは");
  assert.equal(provider.count, 1);
});
