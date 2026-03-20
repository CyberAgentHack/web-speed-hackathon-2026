export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sinceToken = /(?:^|\s)since:([^\s]*)/.exec(query)?.[1];
  const untilToken = /(?:^|\s)until:([^\s]*)/.exec(query)?.[1];

  const keywords = query
    .replace(/since:.*(\d{4}-\d{2}-\d{2}).*/g, "")
    .replace(/until:.*(\d{4}-\d{2}-\d{2}).*/g, "")
    .trim();

  const extractDate = (s: string | undefined) => {
    if (!s) return null;
    const m = /(\d{4}-\d{2}-\d{2})/.exec(s);
    return m ? m[1] : null;
  };

  return {
    keywords,
    sinceDate: extractDate(sinceToken),
    untilDate: extractDate(untilToken),
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const slowDateLike = /^(\d+)+-(\d+)+-(\d+)+$/;
  if (!slowDateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
