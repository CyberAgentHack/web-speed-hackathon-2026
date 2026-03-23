/** YYYY-MM-DD（数値形式のみ。妥当な暦日は Date で確認） */
const ISO_DATE_IN_TOKEN = /(\d{4}-\d{2}-\d{2})/;

export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

/**
 * 検索クエリからキーワードと since/until の日付を取り出す。
 * 重い入れ子正規表現は使わず、トークン単位で処理する。
 */
export const parseSearchQuery = (query: string) => {
  const sincePart = query.match(/\bsince:[^\s]*/)?.[0] ?? "";
  const untilPart = query.match(/\buntil:[^\s]*/)?.[0] ?? "";

  const extractDate = (token: string): string | null => {
    if (!token) return null;
    const m = ISO_DATE_IN_TOKEN.exec(token);
    return m ? m[1]! : null;
  };

  // since:/until: トークンをまとめて除き、空白を正規化（グリーディな .* は使わない）
  let keywords = query
    .trim()
    .replace(/\bsince:[^\s]*/g, " ")
    .replace(/\buntil:[^\s]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    keywords,
    sinceDate: extractDate(sincePart),
    untilDate: extractDate(untilPart),
  };
};

export const isValidDate = (dateStr: string): boolean => {
  // (\d+)+ のような入れ子量指定子は避け、固定形式で先に弾く
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
