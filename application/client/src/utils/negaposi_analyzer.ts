import Bluebird from "bluebird";

let tokenizerPromise: Promise<any> | null = null;

async function getTokenizer() {
  if (tokenizerPromise) return tokenizerPromise;

  tokenizerPromise = (async () => {
    const { default: kuromoji } = await import("kuromoji");
    const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
    return await (builder as any).buildAsync();
  })();

  return tokenizerPromise;
}

export async function analyzeSentiment(text: string): Promise<any> {
  // Dynamic import to avoid bundling kuromoji and negaposi-analyzer into the main bundle
  const { default: analyze } = await import("negaposi-analyzer-ja");

  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);

  return analyze(tokens);
}
