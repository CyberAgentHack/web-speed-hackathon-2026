const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

function extractDate(token: string): string | null {
  return token.match(DATE_PATTERN)?.[0] ?? null;
}

function splitSearchQuery(query: string) {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const keywordTokens: string[] = [];
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (const token of tokens) {
    const lowerToken = token.toLowerCase();

    if (sinceDate === null && (lowerToken.startsWith("since:") || lowerToken.startsWith("from:"))) {
      sinceDate = extractDate(token);
      continue;
    }

    if (untilDate === null && lowerToken.startsWith("until:")) {
      untilDate = extractDate(token);
      continue;
    }

    keywordTokens.push(token);
  }

  return {
    keywords: keywordTokens.join(" "),
    sinceDate,
    untilDate,
  };
}

export const sanitizeSearchText = (input: string): string => {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const lowerToken = token.toLowerCase();

      if (lowerToken.startsWith("since:") || lowerToken.startsWith("from:")) {
        const date = extractDate(token);
        return date ? `since:${date}` : token;
      }

      if (lowerToken.startsWith("until:")) {
        const date = extractDate(token);
        return date ? `until:${date}` : token;
      }

      return token;
    })
    .join(" ");
};

export const parseSearchQuery = (query: string) => {
  return splitSearchQuery(query);
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [yearText, monthText, dayText] = dateStr.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
