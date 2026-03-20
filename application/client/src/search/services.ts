/**
 * 検索テキストからsince:/until:の余分な文字を除去し、正規化する。
 * 元コードは `from` だったが正しくは `since` （parseSearchQueryと一致させる）。
 */
export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\S*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

/**
 * 検索クエリを解析し、キーワード・since日付・until日付を抽出する。
 * 元のネスト量指定子 ((...)+)+ はReDoSを引き起こすため、線形時間パターンに置換。
 */
export const parseSearchQuery = (query: string) => {
  const sincePattern = /since:(\d{4}-\d{2}-\d{2})$/;
  const untilPattern = /until:(\d{4}-\d{2}-\d{2})$/;

  const sincePart = query.match(/since:[^\s]*/)?.[0] || "";
  const untilPart = query.match(/until:[^\s]*/)?.[0] || "";

  const sinceMatch = sincePattern.exec(sincePart);
  const untilMatch = untilPattern.exec(untilPart);

  const keywords = query
    .replace(/since:.*(\d{4}-\d{2}-\d{2}).*/g, "")
    .replace(/until:.*(\d{4}-\d{2}-\d{2}).*/g, "")
    .trim();

  return {
    keywords: keywords || null,
    sinceDate: sinceMatch ? sinceMatch[1]! : null,
    untilDate: untilMatch ? untilMatch[1]! : null,
  };
};

/**
 * 日付文字列がYYYY-MM-DD形式かつ有効な日付かを判定する。
 * 元の (\d+)+ はReDoSを引き起こすため、固定長パターンに置換。
 */
export const isValidDate = (dateStr: string): boolean => {
  const dateLike = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
