import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

const LANG_NAMES: Record<string, string> = {
  ja: "Japanese",
  en: "English",
  zh: "Chinese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
};

type AzureTranslateResponse = Array<{
  translations?: Array<{
    text?: string;
    to?: string;
  }>;
}>;

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text || !sourceLanguage || !targetLanguage) {
    throw new httpErrors.BadRequest("text, sourceLanguage, targetLanguage are required");
  }

  const sourceName = LANG_NAMES[sourceLanguage];
  const targetName = LANG_NAMES[targetLanguage];

  if (!sourceName || !targetName) {
    throw new httpErrors.BadRequest(`Unsupported language code: ${sourceLanguage} or ${targetLanguage}`);
  }

  const endpoint = process.env["AZURE_TRANSLATOR_ENDPOINT"] || "https://api.cognitive.microsofttranslator.com";
  const subscriptionKey = process.env["AZURE_TRANSLATOR_KEY"];
  const subscriptionRegion = process.env["AZURE_TRANSLATOR_REGION"];

  // ローカル開発時に環境変数が未設定なら従来のダミー翻訳で動作を維持する
  if (!subscriptionKey || !subscriptionRegion) {
    const result = `[${targetName}] ${text}`;
    return res.json({ result, provider: "mock" });
  }

  const url = new URL("/translate", endpoint);
  url.searchParams.set("api-version", "3.0");
  url.searchParams.set("from", sourceLanguage);
  url.searchParams.set("to", targetLanguage);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Ocp-Apim-Subscription-Region": subscriptionRegion,
      "Content-Type": "application/json",
      "X-ClientTraceId": crypto.randomUUID(),
    },
    body: JSON.stringify([{ text }]),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new httpErrors.BadGateway(`Azure Translator request failed: ${response.status} ${responseBody}`);
  }

  const data = (await response.json()) as AzureTranslateResponse;
  const translatedText = data[0]?.translations?.[0]?.text;

  if (!translatedText) {
    throw new httpErrors.BadGateway("Azure Translator response is missing translated text");
  }

  return res.json({ result: translatedText, provider: "azure" });
});
