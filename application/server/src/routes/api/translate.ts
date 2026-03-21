import { Router } from "express";
import httpErrors from "http-errors";

import { translateJaToEn } from "@web-speed-hackathon-2026/server/src/utils/translate";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (typeof text !== "string" || text.trim() === "") {
    throw new httpErrors.BadRequest("text is required");
  }

  const translated = await translateJaToEn(text);

  return res.status(200).type("application/json").send({ result: translated });
});
