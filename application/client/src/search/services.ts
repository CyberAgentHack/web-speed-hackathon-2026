const SEARCH_FILTER_PATTERN = /(^|\s)(since|until):([^\s]+)/g;
const STRICT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_match, key: string, date) => `${key.toLowerCase() === "from" ? "since" : key.toLowerCase()}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (const match of query.matchAll(SEARCH_FILTER_PATTERN)) {
    const key = match[2];
    const value = match[3];
    if (key === "since" && sinceDate === null) {
      sinceDate = value ?? null;
    }
    if (key === "until" && untilDate === null) {
      untilDate = value ?? null;
    }
  }

  const keywords = query.replaceAll(SEARCH_FILTER_PATTERN, " ").trim().replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const match = STRICT_DATE_PATTERN.exec(dateStr);
  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
