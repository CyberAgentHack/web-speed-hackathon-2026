export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(since|from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key.toLowerCase()}:${date}`,
  );

  return text;
};

const DATE_LITERAL_PATTERN = "(\\d{4}-\\d{2}-\\d{2})";

function extractDateTag(query: string, tag: "since" | "until"): string | null {
  const re = new RegExp(`(?:^|\\s)${tag}:${DATE_LITERAL_PATTERN}`);
  const match = re.exec(query);
  return match?.[1] ?? null;
}

export const parseSearchQuery = (query: string) => {
  const sinceDate = extractDateTag(query, "since");
  const untilDate = extractDateTag(query, "until");

  const keywords = query
    .replace(/(?:^|\s)since:[^\s]*/gi, " ")
    .replace(/(?:^|\s)until:[^\s]*/gi, " ")
    .trim()
    .replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
