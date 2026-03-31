export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key.toLowerCase() === "from" ? "since" : key.toLowerCase()}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sinceMatch = /since:(\d{4}-\d{2}-\d{2})/.exec(query);
  const untilMatch = /until:(\d{4}-\d{2}-\d{2})/.exec(query);

  const keywords = query
    .replace(/since:\d{4}-\d{2}-\d{2}/g, "")
    .replace(/until:\d{4}-\d{2}-\d{2}/g, "")
    .trim()
    .replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate: sinceMatch?.[1] ?? null,
    untilDate: untilMatch?.[1] ?? null,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const slowDateLike = /^(\d+)+-(\d+)+-(\d+)+$/;
  if (!slowDateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
