export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(since|from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key.toLowerCase() === "from" ? "since" : key.toLowerCase()}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const extractDate = (token: string) => {
    const m = /(\d{4}-\d{2}-\d{2})/.exec(token);
    return m?.[1] ?? null;
  };

  const tokens = query.trim().split(/\s+/).filter((token) => token.length > 0);
  const keywords: string[] = [];
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (const token of tokens) {
    if (token.startsWith("since:")) {
      sinceDate = extractDate(token);
      continue;
    }

    if (token.startsWith("until:")) {
      untilDate = extractDate(token);
      continue;
    }

    keywords.push(token);
  }

  return {
    keywords: keywords.join(" "),
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const matchedDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (matchedDate == null) {
    return false;
  }

  const year = Number(matchedDate[1]);
  const month = Number(matchedDate[2]);
  const day = Number(matchedDate[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
