const LEADING_DATE_VALUE_RE = /^(\d{4}-\d{2}-\d{2})/;
const DATE_VALUE_RE = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateTokenKey = (key: string): "since" | "until" | null => {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey === "from" || normalizedKey === "since") {
    return "since";
  }

  if (normalizedKey === "until") {
    return "until";
  }

  return null;
};

const extractLeadingDateValue = (rawValue: string): string | null => {
  const match = LEADING_DATE_VALUE_RE.exec(rawValue);

  return match?.[1] ?? null;
};

const extractDateFilters = (query: string) => {
  const keywords: string[] = [];
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (const token of query.split(/\s+/)) {
    if (!token) {
      continue;
    }

    const separatorIndex = token.indexOf(":");
    if (separatorIndex <= 0) {
      keywords.push(token);
      continue;
    }

    const key = normalizeDateTokenKey(token.slice(0, separatorIndex));
    if (!key) {
      keywords.push(token);
      continue;
    }

    const rawValue = token.slice(separatorIndex + 1);
    const normalizedDateValue = extractLeadingDateValue(rawValue);
    const resolvedDateValue = normalizedDateValue ?? rawValue ?? null;

    if (key === "since") {
      sinceDate = resolvedDateValue;
      continue;
    }

    untilDate = resolvedDateValue;
  }

  return {
    keywords: keywords.join(" "),
    sinceDate,
    untilDate,
  };
};

export const sanitizeSearchText = (input: string): string => {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const separatorIndex = token.indexOf(":");
      if (separatorIndex <= 0) {
        return token;
      }

      const key = normalizeDateTokenKey(token.slice(0, separatorIndex));
      if (!key) {
        return token;
      }

      const rawValue = token.slice(separatorIndex + 1);
      const normalizedDateValue = extractLeadingDateValue(rawValue);

      return normalizedDateValue ? `${key}:${normalizedDateValue}` : token;
    })
    .join(" ");
};

export const parseSearchQuery = (query: string) => {
  const { keywords, sinceDate, untilDate } = extractDateFilters(query.trim());

  return {
    keywords,
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!DATE_VALUE_RE.test(dateStr)) {
    return false;
  }

  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
