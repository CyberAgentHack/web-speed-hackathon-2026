type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const [{ default: analyze }, { default: kuromoji }, { default: Bluebird }] = await Promise.all([
    import("negaposi-analyzer-ja"),
    import("kuromoji"),
    import("bluebird"),
  ]);

  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
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
