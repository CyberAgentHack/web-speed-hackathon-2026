export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(since|from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})[^\s]*/gi,
    (_m, key, date) => `${key.toLowerCase() === "from" ? "since" : key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  let sinceDate: string | null = null;
  let untilDate: string | null = null;
  const keywords: string[] = [];

  for (const token of query.trim().split(/\s+/)) {
    if (token === "") {
      continue;
    }

    const dateTokenMatch = /^(since|until):([^\s]+)$/i.exec(token);
    if (dateTokenMatch == null) {
      keywords.push(token);
      continue;
    }

    const key = dateTokenMatch[1];
    const rawDate = dateTokenMatch[2];
    if (key == null || rawDate == null) {
      continue;
    }

    const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(rawDate);
    const normalizedDate = dateMatch?.[1] ?? null;
    if (key.toLowerCase() === "since") {
      sinceDate = normalizedDate;
    } else {
      untilDate = normalizedDate;
    }
  }

  return {
    keywords: keywords.join(" ").trim(),
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateStr;
};
