import { Router } from "express";
import { analyzeSentiment } from "@web-speed-hackathon-2026/server/src/utils/negaposi_analyzer";

export const negaposiRouter = Router();

negaposiRouter.post("/analyze-sentiment", async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== "string") {
      res.status(400).json({ message: "Invalid text" });
      return;
    }
    const result = await analyzeSentiment(text);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
