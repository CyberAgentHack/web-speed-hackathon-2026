import { Router } from "express";

export const translateRouter = Router();

translateRouter.post("/translate", async (req, res) => {
  const { text, sourceLanguage, targetLanguage } = req.body as {
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
  };

  if (!text) {
    res.json({ result: "" });
    return;
  }

  const sl = sourceLanguage || "ja";
  const tl = targetLanguage || "en";

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();

    const translated = (data[0] as any[])
      .map((segment: any) => segment[0])
      .join("");

    res.json({ result: translated });
  } catch {
    res.json({ result: "翻訳に失敗しました" });
  }
});
