export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const datePattern = /\d{4}-\d{2}-\d{2}/;

  const sinceRaw = query.match(/since:([^\s]*)/)?.[1] || "";
  const untilRaw = query.match(/until:([^\s]*)/)?.[1] || "";

  const sinceDate = datePattern.exec(sinceRaw)?.[0] ?? null;
  const untilDate = datePattern.exec(untilRaw)?.[0] ?? null;

  const keywords = query
    .replace(/since:\S*/g, "")
    .replace(/until:\S*/g, "")
    .trim();

  return {
    keywords,
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const slowDateLike = /^(\d+)+-(\d+)+-(\d+)+$/;
  if (!slowDateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
