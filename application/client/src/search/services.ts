export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const extractToken = (key: "since" | "until") =>
    new RegExp(`(?:^|\\s)${key}:([^\\s]*)`, "i").exec(query)?.[1] ?? null;
  const extractDate = (value: string | null) =>
    /(\d{4}-\d{2}-\d{2})/.exec(value ?? "")?.[1] ?? null;

  const keywords = query.replace(/(?:^|\s)(?:since|until):[^\s]*/gi, " ").trim();

  return {
    keywords,
    sinceDate: extractDate(extractToken("since")),
    untilDate: extractDate(extractToken("until")),
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match == null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};
