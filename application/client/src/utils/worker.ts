self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    if (type === "analyzeSentiment") {
      // 正規表現を使った簡易判定モック
      const isPositive = /(良い|最高|好き|うれしい|楽しみ)/.test(payload);
      const isNegative = /(悪い|最低|嫌い|悲しい|残念)/.test(payload);
      const score = isPositive ? 1 : isNegative ? -1 : 0;
      const label = isPositive ? "positive" : isNegative ? "negative" : "neutral";

      self.postMessage({ id, result: { score, label } });
    } else if (type === "extractExif") {
      // EXIF解析をスキップするモック
      self.postMessage({ id, result: "画像" });
    } else if (type === "getImageSize") {
      // image-size を使用しないダミーサイズ
      self.postMessage({ id, result: { width: 800, height: 600 } });
    }
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
