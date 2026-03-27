export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /(^|\s)(since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\S*/gi,
    (_m, prefix, key, date) => `${prefix}${key}:${date}`,
  );

  text = text.replace(/since:(\d{4}-\d{2}-\d{2})\S*/gi, "since:$1");
  text = text.replace(/until:(\d{4}-\d{2}-\d{2})\S*/gi, "until:$1");

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sinceToken = /since:(\d{4}-\d{2}-\d{2})/.exec(query)?.[1];
  const untilToken = /until:(\d{4}-\d{2}-\d{2})/.exec(query)?.[1];

  const keywords = query
    .replace(/since:\S*/g, "")
    .replace(/until:\S*/g, "")
    .trim()
    .replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate: sinceToken ?? null,
    untilDate: untilToken ?? null,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const dateLike = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
