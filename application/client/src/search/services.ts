export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\S*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sincePattern = /since:(\d{4}-\d{2}-\d{2})/;
  const untilPattern = /until:(\d{4}-\d{2}-\d{2})/;

  const sincePart = query.match(/since:\S*/)?.[0] || "";
  const untilPart = query.match(/until:\S*/)?.[0] || "";

  const sinceMatch = sincePattern.exec(sincePart);
  const untilMatch = untilPattern.exec(untilPart);

  const keywords = query
    .replace(/since:\S*/g, "")
    .replace(/until:\S*/g, "")
    .trim();

  return {
    keywords,
    sinceDate: sinceMatch ? sinceMatch[1]! : null,
    untilDate: untilMatch ? untilMatch[1]! : null,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const dateLike = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
