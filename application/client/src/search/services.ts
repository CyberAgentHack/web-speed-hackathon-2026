export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sinceMatch = /since:(\d{4}-\d{2}-\d{2})/.exec(query);
  const untilMatch = /until:(\d{4}-\d{2}-\d{2})/.exec(query);

  const keywords = query
    .replace(/since:.*(\d{4}-\d{2}-\d{2}).*/g, "")
    .replace(/until:.*(\d{4}-\d{2}-\d{2}).*/g, "")
    .trim();

  const extractDate = (s: string | null) => {
    if (!s) return null;
    const m = /(\d{4}-\d{2}-\d{2})/.exec(s);
    return m ? m[1] : null;
  };

  return {
    keywords,
    sinceDate: extractDate(sinceMatch?.[1] ?? null),
    untilDate: extractDate(untilMatch?.[1] ?? null),
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
