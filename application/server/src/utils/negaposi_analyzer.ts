import { createRequire } from "module";
import path from "path";
import Bluebird from "bluebird";
import kuromoji, { type Tokenizer, type IpadicFeatures } from "kuromoji";
import analyze from "negaposi-analyzer-ja";

const require = createRequire(import.meta.url);
const kuromojiDir = path.dirname(require.resolve("kuromoji/package.json"));
const dicPath = path.join(kuromojiDir, "dict");

async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
    const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath }));
    return await (builder as any).buildAsync();
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
