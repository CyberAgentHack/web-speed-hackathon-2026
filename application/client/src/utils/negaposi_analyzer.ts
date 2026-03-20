type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const [Bluebird, kuromoji, { default: analyze }] = await Promise.all([
    import("bluebird"),
    import("kuromoji"),
    import("negaposi-analyzer-ja"),
  ]);

  const builder = Bluebird.default.promisifyAll(kuromoji.default.builder({ dicPath: "/dicts" }));
  const tokenizer = await builder.buildAsync();
  const tokens = tokenizer.tokenize(text);

  const score = analyze(tokens);

  let label: SentimentResult["label"];
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  } else {
    label = "neutral";
  }

  return { score, label };
}
