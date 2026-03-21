import { Router } from "express";

const TRANSLATION_MAP: Record<string, string> = {
  "おすすめの本があったら教えてください！": "If you have any book recommendations, please let me know!",
  "このアニメ、タイトルなんだっけ...懐かしい気がするんだけど...": "What was the title of this anime... It feels nostalgic...",
  "このカメラマンの写真がすごく美しい、感動してる": "This photographer's pictures are incredibly beautiful, I'm moved",
  "今日のランチは最高だった": "Today's lunch was the best",
  "今日はこの曲でリラックス、疲れが癒される": "Relaxing with this song today, it heals the fatigue",
  "今日もいい天気だね！": "Nice weather again today!",
  "写真でボケて！お題の写真はこちら、解答お待ちしてます！": "Make a funny caption for this photo! Here's the photo prompt, waiting for your answers!",
  "写真に残すと記憶にも残りやすいよね、自分の人生で印象強い写真はこれ": "Photos help memories stick, right? This is the most memorable photo of my life",
  "新しい趣味を見つけたい...": "I want to find a new hobby...",
  "旅行に行ってきました！景色がキレイで楽しかった": "I went on a trip! The scenery was beautiful and it was fun",
  "昔はここまで綺麗な写真をスマホで撮れなかったよ、スマホのカメラもすごいなぁ": "We couldn't take such beautiful photos with smartphones before, smartphone cameras are amazing",
  "最近カメラにハマっていて、色々な日常風景を撮影してる": "I've been into cameras lately, taking photos of various everyday scenes",
  "親からこの写真送られてきたんだけど、どういう意味なんだろう...": "My parents sent me this photo, but what does it mean...",
  "謎解きの問題なんだけど、写真から読み取れる情報が多すぎて難しい": "It's a puzzle, but there's too much information in the photo and it's difficult",
  "週末の予定を考え中": "Thinking about plans for the weekend",
  "そういうこと考えたことなかった、すごいですね！": "I never thought about that, that's amazing!",
  "それは深く考えすぎだよ、もっと気楽に": "You're overthinking it, take it easy",
  "とてもいいですね、自分好みです": "That's really nice, it's my taste",
  "なるほど、参考になりました": "I see, that was helpful",
  "わたしも同じこと考えてました！": "I was thinking the same thing!",
  "共感しかない": "I can totally relate",
  "最近はこういう感じなんですね、勉強になります": "So this is how it is these days, that's informative",
  "素敵な投稿をありがとう！": "Thanks for the lovely post!",
  "自分も同じ経験があって、共感できました！": "I've had the same experience, I can relate!",
  "面白い視点ですね！": "That's an interesting perspective!",
};

export const translateRouter = Router();

translateRouter.get("/translate", async (req, res) => {
  const text = req.query["text"];

  if (typeof text !== "string" || text.trim() === "") {
    return res.status(400).type("application/json").send({ error: "text is required" });
  }

  const translated = TRANSLATION_MAP[text];

  if (translated == null) {
    return res.status(404).type("application/json").send({ error: "translation not found" });
  }

  return res.status(200).type("application/json").send({ result: translated });
});
