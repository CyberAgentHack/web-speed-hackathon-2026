import Bluebird from "bluebird";
import analyze from "negaposi-analyzer-ja";

async function getTokenizer(): Promise<any> {
  // 動的インポート
  const kuromoji = await import("kuromoji");
  // Tokenizer型を動的インポートから取得できないのでanyを使用

  const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
  return await builder.buildAsync();
}

type SentimentResult = {
  score: number;
  label: "positive" | "negative" | "neutral";
};

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const tokenizer = await getTokenizer();
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
