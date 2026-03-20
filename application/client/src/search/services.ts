export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sincePart = query.match(/since:[^\s]*/)?.[0] || "";
  const untilPart = query.match(/until:[^\s]*/)?.[0] || "";

  const extractDate = (s: string) => {
    if (!s) return null;
    const m = /(\d{4}-\d{2}-\d{2})/.exec(s);
    return m ? m[1]! : null;
  };

  const sinceDate = extractDate(sincePart);
  const untilDate = extractDate(untilPart);

  const keywords = query
    .replace(/since:[^\s]*/g, "")
    .replace(/until:[^\s]*/g, "")
    .trim();

  return { keywords, sinceDate, untilDate };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
