export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

function extractDateTokenValue(token: string, prefix: "since:" | "until:"): string | null {
  if (!token.startsWith(prefix)) {
    return null;
  }

  const match = token.slice(prefix.length).match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

export const parseSearchQuery = (query: string) => {
  const tokens = query.split(/\s+/).filter(Boolean);
  const keywords: string[] = [];
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (const token of tokens) {
    const nextSinceDate = extractDateTokenValue(token, "since:");
    if (nextSinceDate !== null) {
      sinceDate = nextSinceDate;
      continue;
    }

    const nextUntilDate = extractDateTokenValue(token, "until:");
    if (nextUntilDate !== null) {
      untilDate = nextUntilDate;
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
