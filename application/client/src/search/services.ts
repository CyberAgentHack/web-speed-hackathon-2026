export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sinceDateMatch = /since:(\d{4}-\d{2}-\d{2})/.exec(query);
  const untilDateMatch = /until:(\d{4}-\d{2}-\d{2})/.exec(query);

  const keywords = query
    .replace(/since:\S*/g, "")
    .replace(/until:\S*/g, "")
    .trim();

  return {
    keywords,
    sinceDate: sinceDateMatch ? sinceDateMatch[1]! : null,
    untilDate: untilDateMatch ? untilDateMatch[1]! : null,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const slowDateLike = /^(\d+)+-(\d+)+-(\d+)+$/;
  if (!slowDateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
