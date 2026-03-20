import { Router } from "express";
import httpErrors from "http-errors";
import OpenAI from "openai";

export const translateRouter = Router();

const client = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

translateRouter.post("/translate", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const { text, sourceLang = "ja", targetLang = "en" } = req.body as {
    text?: string;
    sourceLang?: string;
    targetLang?: string;
  };

  if (!text || typeof text !== "string") {
    throw new httpErrors.BadRequest("text is required");
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Translate the following text from ${sourceLang} to ${targetLang}. Return only the translated text, no explanations.`,
      },
      { role: "user", content: text },
    ],
    temperature: 0,
  });

  const translated = completion.choices[0]?.message.content ?? "";

  return res.status(200).type("application/json").send({ result: translated });
});
