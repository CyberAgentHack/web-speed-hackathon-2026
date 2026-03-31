import path from "node:path";

let tokenizerPromise: Promise<any> | null = null;

async function getTokenizer() {
  if (tokenizerPromise != null) {
    return tokenizerPromise;
  }

  tokenizerPromise = (async () => {
    const [{ default: Bluebird }, kuromojiModule] = await Promise.all([
      import("bluebird"),
      import("kuromoji"),
    ]);

    const kuromoji = (kuromojiModule as { default?: any }).default ?? kuromojiModule;
    const dicPath = path.resolve(import.meta.dirname, "../../../public/dicts");
    const builder = (Bluebird as any).promisifyAll(kuromoji.builder({ dicPath }));
    return await builder.buildAsync();
  })();

  return tokenizerPromise;
}

export async function isNegativeSearchQuery(text: string): Promise<boolean> {
  const normalized = text.trim();
  if (normalized === "") {
    return false;
  }

  const [{ default: analyze }, tokenizer] = await Promise.all([
    import("negaposi-analyzer-ja"),
    getTokenizer(),
  ]);

  const score = analyze(tokenizer.tokenize(normalized));
  return score < -0.1;
}
