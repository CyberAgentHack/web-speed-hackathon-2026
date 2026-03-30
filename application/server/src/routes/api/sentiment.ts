import { Router } from "express";
import { analyzeSentiment } from "../../utils/sadness";
import httpErrors from "http-errors";

export const sentimentRouter = Router();

sentimentRouter.get("/sad", async (req, res) => {
  const query = req.query["q"] && decodeURI(req.query["q"] as string);

  if(typeof query !== "string" || query === undefined) {
    throw new httpErrors.BadRequest();
  }

  return res
    .status(200)
    .type("application/json")
    .send({
      sad: (await analyzeSentiment(query)).label === "negative",
    });
})
