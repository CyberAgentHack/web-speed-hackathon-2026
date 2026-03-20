import Bluebird from "bluebird";

export async function analyzeSentiment(text: string): Promise<number> {
  // Dynamic import to avoid bundling kuromoji and negaposi-analyzer into the main bundle
  const { default: kuromoji } = await import("kuromoji");
  const { default: analyze } = await import("negaposi-analyzer-ja");

  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));

  const tokenizer = await (builder as any).buildAsync();

  const tokens = tokenizer.tokenize(text);

  return analyze(tokens);
}
