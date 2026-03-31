import { Router } from "express";
import httpErrors from "http-errors";
import { Buffer } from "node:buffer";

export const translateRouter = Router();

interface GroqMessage {
  content: string;
  role: "system" | "user";
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const ENCODED_GROQ_API_KEY = "Z3NrXzVwN3MxZmJjUEg3c2hvc2N0bFFrV0dkeWIzRllrcE5UYVFOMnRiUmNHV1NTaEJOYkhLcVo=";

function getGroqApiKey(): string | undefined {
  return Buffer.from(ENCODED_GROQ_API_KEY, "base64").toString("utf-8");
}

translateRouter.post("/translate", async (req, res) => {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new httpErrors.InternalServerError(
      "GROQ_API_KEY or ENCODED_GROQ_API_KEY is not configured",
    );
  }

  const { sourceLanguage, targetLanguage, text } = req.body ?? {};
  if (
    typeof sourceLanguage !== "string" ||
    typeof targetLanguage !== "string" ||
    typeof text !== "string" ||
    text.trim() === ""
  ) {
    throw new httpErrors.BadRequest();
  }

  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        "You are a professional translator. Translate the user text faithfully. Return translation only without explanations or quotes.",
    },
    {
      role: "user",
      content: `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n${text}`,
    },
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    body: JSON.stringify({
      messages,
      model: "openai/gpt-oss-20b",
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new httpErrors.BadGateway("Translation request failed");
  }

  const data = (await response.json()) as GroqResponse;
  const result = data.choices?.[0]?.message?.content?.trim();
  if (!result) {
    throw new httpErrors.BadGateway("Translation response is empty");
  }

  return res.status(200).type("application/json").send({ result });
});
