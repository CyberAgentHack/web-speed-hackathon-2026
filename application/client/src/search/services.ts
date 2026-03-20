export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\S*/gi,
    (_m, key: string, date: string) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const datePattern = /\d{4}-\d{2}-\d{2}/;

  const sinceMatch = query.match(/since:(\d{4}-\d{2}-\d{2})/);
  const untilMatch = query.match(/until:(\d{4}-\d{2}-\d{2})/);

  const keywords = query
    .replace(/since:\S*/g, "")
    .replace(/until:\S*/g, "")
    .trim();

  return {
    keywords,
    sinceDate: sinceMatch?.[1] && datePattern.test(sinceMatch[1]) ? sinceMatch[1] : null,
    untilDate: untilMatch?.[1] && datePattern.test(untilMatch[1]) ? untilMatch[1] : null,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
