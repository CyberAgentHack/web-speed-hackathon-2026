interface ParsedSearchQuery {
  keywords: string;
  sinceDate: Date | null;
  untilDate: Date | null;
}

const SEARCH_FILTER_PATTERN = /(^|\s)(since|until):([^\s]+)/g;
const STRICT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseStrictDate(value: string): Date | null {
  const match = STRICT_DATE_PATTERN.exec(value);
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  let sinceDate: Date | null = null;
  let untilDate: Date | null = null;

  for (const match of query.matchAll(SEARCH_FILTER_PATTERN)) {
    const key = match[2];
    const value = match[3];
    const date = value == null ? null : parseStrictDate(value);
    if (date === null) {
      continue;
    }
    if (key === "since" && sinceDate === null) {
      date.setUTCHours(0, 0, 0, 0);
      sinceDate = date;
    }
    if (key === "until" && untilDate === null) {
      date.setUTCHours(23, 59, 59, 999);
      untilDate = date;
    }
  }

  const keywords = query.replaceAll(SEARCH_FILTER_PATTERN, " ").trim().replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate,
    untilDate,
  };
}
