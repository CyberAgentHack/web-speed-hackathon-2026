import { Router } from "express";
import translate from "google-translate-api-x";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, from, to } = req.body as { text?: string; from?: string; to?: string };

  if (!text || !from || !to) {
    return res.status(400).json({ error: "text, from, to are required" });
  }

  try {
    const result = await translate(text, { from, to });
    return res.status(200).json({ result: result.text });
  } catch {
    return res.status(500).json({ error: "Translation failed" });
  }
});
