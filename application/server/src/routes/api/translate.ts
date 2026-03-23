import { Router } from "express";
import translate from "google-translate-api-x";

export const translateRouter = Router();

translateRouter.get("/translate", async (req, res) => {
  const text = req.query["text"];
  const from = req.query["from"] ?? "ja";
  const to = req.query["to"] ?? "en";

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(200).type("application/json").send({ result: "" });
  }

  if (typeof from !== "string" || typeof to !== "string") {
    return res.status(400).type("application/json").send({ error: "Invalid language parameters" });
  }

  const result = await translate(text, { from, to });
  return res.status(200).type("application/json").send({ result: result.text });
});
