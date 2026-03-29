import { Router } from "express";
import httpErrors from "http-errors";

import { translate } from "@web-speed-hackathon-2026/server/src/utils/translator";

export const translateRouter = Router();

translateRouter.get("/translate", async (req, res) => {
  const text = req.query["text"];

  if (typeof text !== "string" || text.length === 0) {
    throw new httpErrors.BadRequest("text query parameter is required");
  }

  const result = await translate(text);

  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.type("application/json").send({ result });
});
