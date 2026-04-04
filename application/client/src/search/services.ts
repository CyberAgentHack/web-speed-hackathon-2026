export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

export const parseSearchQuery = (query: string) => {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const keywordTokens: string[] = [];
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (const token of tokens) {
    const normalizedToken = token.toLowerCase();

    if (normalizedToken.startsWith("since:")) {
      const date = DATE_PATTERN.exec(token)?.[0] ?? null;
      if (date != null && sinceDate == null) {
        sinceDate = date;
        continue;
      }
    }

    if (normalizedToken.startsWith("until:")) {
      const date = DATE_PATTERN.exec(token)?.[0] ?? null;
      if (date != null && untilDate == null) {
        untilDate = date;
        continue;
      }
    }

    keywordTokens.push(token);
  }

  return {
    keywords: keywordTokens.join(" ").trim(),
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) {
    return false;
  }

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (year == null || month == null || day == null) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
};
