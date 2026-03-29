export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\S*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const extractDate = (pattern: RegExp) => pattern.exec(query)?.[1] ?? null;

  return {
    keywords: query
      .replace(/since:\S*/g, "")
      .replace(/until:\S*/g, "")
      .trim()
      .replace(/\s+/g, " "),
    sinceDate: extractDate(/since:(\d{4}-\d{2}-\d{2})/),
    untilDate: extractDate(/until:(\d{4}-\d{2}-\d{2})/),
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const slowDateLike = /^(\d+)+-(\d+)+-(\d+)+$/;
  if (!slowDateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
