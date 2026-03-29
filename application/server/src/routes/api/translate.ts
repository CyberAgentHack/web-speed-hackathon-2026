import { Router } from "express";
import { translate } from "@vitalets/google-translate-api";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, from, to } = req.body as { text?: string; from?: string; to?: string };

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(400).type("application/json").send({ message: "text is required" });
  }

  try {
    const result = await translate(text, { from: from ?? "ja", to: to ?? "en" });
    return res.status(200).type("application/json").send({ result: result.text });
  } catch {
    return res.status(500).type("application/json").send({ message: "Translation failed" });
  }
});
