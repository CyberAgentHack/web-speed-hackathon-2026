import { Router } from "express";
import httpErrors from "http-errors";

export const translateRouter = Router();

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/;
const MAX_TRANSLATION_TEXT_LENGTH = 5000;

function parseTranslatedText(body: unknown): string | null {
  if (!Array.isArray(body) || !Array.isArray(body[0])) {
    return null;
  }

  const translatedSegments = body[0]
    .flatMap((segment) => {
      if (!Array.isArray(segment) || typeof segment[0] !== "string") {
        return [];
      }
      return [segment[0]];
    })
    .filter((segment) => segment !== "");

  return translatedSegments.length > 0 ? translatedSegments.join("") : null;
}

translateRouter.post("/translate", async (req, res) => {
  const { sourceLanguage, targetLanguage, text } = req.body;

  if (
    typeof sourceLanguage !== "string" ||
    typeof targetLanguage !== "string" ||
    typeof text !== "string" ||
    !LANGUAGE_CODE_PATTERN.test(sourceLanguage) ||
    !LANGUAGE_CODE_PATTERN.test(targetLanguage) ||
    text.trim() === "" ||
    text.length > MAX_TRANSLATION_TEXT_LENGTH
  ) {
    throw new httpErrors.BadRequest();
  }

  const searchParams = new URLSearchParams({
    client: "gtx",
    dt: "t",
    q: text,
    sl: sourceLanguage,
    tl: targetLanguage,
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${searchParams}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new httpErrors.BadGateway("Translation request failed.");
  }

  const translatedText = parseTranslatedText((await response.json()) as unknown);

  if (translatedText === null) {
    throw new httpErrors.BadGateway("Unexpected translation response.");
  }

  return res.status(200).type("application/json").send({ text: translatedText });
});
