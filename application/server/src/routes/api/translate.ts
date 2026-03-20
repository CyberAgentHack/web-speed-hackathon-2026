import { Router } from "express";

import {loads} from "json-repair-js";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { stripIndents } from "common-tags";
import langs from "langs";
import invariant from "tiny-invariant";


export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const sourceLang = langs.where("1", req.query["sourceLanguage"]);
  invariant(sourceLang, `Unsupported source language code: ${req.query["sourceLanguage"]}`);

  const targetLang = langs.where("1", req.query["targetLanguage"]);
  invariant(targetLang, `Unsupported target language code: ${req.query["targetLanguage"]}`);

  const engine = await CreateMLCEngine("gemma-2-2b-jpn-it-q4f16_1-MLC");

      const reply = await engine.chat.completions.create({
        messages: [
          {
            role: "system",
            content: stripIndents`
              You are a professional translator. Translate the following text from ${sourceLang.name} to ${targetLang.name}.
              Provide as JSON only in the format: { "result": "{{translated text}}" } without any additional explanations.
            `,
          },
          {
            role: "user",
            content: String(req.query["text"]),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      });

      const content = reply.choices[0]!.message.content;
      invariant(content, "No content in the reply from the translation engine.");

      const parsed = loads(content);
      invariant(
        parsed != null && "result" in parsed,
        "The translation result is missing in the reply.",
      );

  return res.status(200).type("application/json").send({ text: String(parsed.result) });
});
