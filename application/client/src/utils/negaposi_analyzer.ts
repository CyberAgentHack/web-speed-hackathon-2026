interface TokenizerLike {
  tokenize(text: string): unknown[];
}

let tokenizerPromise: Promise<TokenizerLike> | null = null;

async function getTokenizer(): Promise<TokenizerLike> {
  if (tokenizerPromise == null) {
    tokenizerPromise = (async () => {
      const [{ default: Bluebird }, { default: kuromoji }] = await Promise.all([
        import("bluebird"),
        import("kuromoji"),
      ]);

      const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
      return await builder.buildAsync();
    })();
  }

  return await tokenizerPromise;
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const [{ default: analyze }, tokenizer] = await Promise.all([
    import("negaposi-analyzer-ja"),
    getTokenizer(),
  ]);

  const tokens = tokenizer.tokenize(text);
  const score = analyze(tokens as never);

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
