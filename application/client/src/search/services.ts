const DATE_LENGTH = 10;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DateFilterKey = "since" | "until";

interface ParsedDateFilter {
  key: DateFilterKey;
  date: string;
  consumedNextToken: boolean;
}

function normalizeFilterKey(rawKey: string): DateFilterKey | null {
  const key = rawKey.toLowerCase();
  if (key === "since" || key === "from") {
    return "since";
  }
  if (key === "until") {
    return "until";
  }
  return null;
}

function extractDatePrefix(value: string): string | null {
  if (value.length < DATE_LENGTH) {
    return null;
  }
  const prefix = value.slice(0, DATE_LENGTH);
  if (!DATE_PATTERN.test(prefix)) {
    return null;
  }
  return prefix;
}

function parseDateFilterToken(
  token: string,
  nextToken: string | undefined,
): ParsedDateFilter | null {
  const separatorIndex = token.indexOf(":");
  if (separatorIndex >= 0) {
    const key = normalizeFilterKey(token.slice(0, separatorIndex));
    if (key == null) {
      return null;
    }

    const rawValue = token.slice(separatorIndex + 1);
    if (rawValue.length > 0) {
      const date = extractDatePrefix(rawValue);
      if (date == null) {
        return null;
      }
      return { key, date, consumedNextToken: false };
    }

    if (nextToken == null) {
      return null;
    }
    const date = extractDatePrefix(nextToken);
    if (date == null) {
      return null;
    }
    return { key, date, consumedNextToken: true };
  }

  const key = normalizeFilterKey(token);
  if (key == null || nextToken == null) {
    return null;
  }
  const date = extractDatePrefix(nextToken);
  if (date == null) {
    return null;
  }
  return { key, date, consumedNextToken: true };
}

export const sanitizeSearchText = (input: string): string => {
  const trimmed = input.trim();
  if (trimmed === "") {
    return "";
  }

  const tokens = trimmed.split(/\s+/);
  const sanitizedTokens: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!;
    const parsed = parseDateFilterToken(token, tokens[i + 1]);
    if (parsed == null) {
      sanitizedTokens.push(token);
      continue;
    }
    sanitizedTokens.push(`${parsed.key}:${parsed.date}`);
    if (parsed.consumedNextToken) {
      i += 1;
    }
  }

  return sanitizedTokens.join(" ");
};

export const parseSearchQuery = (query: string) => {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  const keywordTokens: string[] = [];
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!;
    const parsed = parseDateFilterToken(token, tokens[i + 1]);
    if (parsed == null) {
      keywordTokens.push(token);
      continue;
    }

    if (parsed.key === "since" && sinceDate == null) {
      sinceDate = parsed.date;
    }
    if (parsed.key === "until" && untilDate == null) {
      untilDate = parsed.date;
    }
    if (parsed.consumedNextToken) {
      i += 1;
    }
  }

  return {
    keywords: keywordTokens.join(" "),
    sinceDate,
    untilDate,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!DATE_PATTERN.test(dateStr)) {
    return false;
  }

  const [yearPart, monthPart, dayPart] = dateStr.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
