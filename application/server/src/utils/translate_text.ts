import { CreateMLCEngine } from "@mlc-ai/web-llm";
import httpErrors from "http-errors";

interface Params {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}

interface TranslateResponse {
  result: unknown;
}

const MODEL_ID = "gemma-2-2b-jpn-it-q4f16_1-MLC";

let enginePromise: Promise<Awaited<ReturnType<typeof CreateMLCEngine>>> | undefined;

async function getEngine(): Promise<Awaited<ReturnType<typeof CreateMLCEngine>>> {
  if (enginePromise === undefined) {
    enginePromise = CreateMLCEngine(MODEL_ID);
  }
  return enginePromise;
}

function parseResult(content: string): string {
  try {
    const parsed = JSON.parse(content) as TranslateResponse;
    if (typeof parsed.result !== "string") {
      throw new Error("The translation result is missing in the reply.");
    }
    return parsed.result;
  } catch {
    throw new httpErrors.BadGateway("Failed to parse translation response.");
  }
}

export async function translateText(params: Params): Promise<string> {
  const engine = await getEngine();
  const reply = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          `You are a professional translator. Translate the following text from ${params.sourceLanguage} to ${params.targetLanguage}. ` +
          'Provide as JSON only in the format: { "result": "{{translated text}}" } without any additional explanations.',
      },
      {
        role: "user",
        content: params.text,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const content = reply.choices[0]?.message.content;
  if (typeof content !== "string") {
    throw new httpErrors.BadGateway("No content in the reply from the translation engine.");
  }

  return parseResult(content);
}
