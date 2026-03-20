function isDatePrefix(value: string): boolean {
  if (value.length < 10) {
    return false;
  }

  for (const index of [0, 1, 2, 3, 5, 6, 8, 9]) {
    const code = value.charCodeAt(index);
    if (code < 48 || code > 57) {
      return false;
    }
  }

  return value[4] === "-" && value[7] === "-";
}

function extractDatePrefix(value: string): string | null {
  const candidate = value.slice(0, 10);
  return isDatePrefix(candidate) ? candidate : null;
}

function parseTokenizedQuery(input: string) {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const keywordTokens: string[] = [];
  let sinceDate: string | null = null;
  let untilDate: string | null = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    const lowerToken = token.toLowerCase();

    if (
      lowerToken === "since" ||
      lowerToken === "since:" ||
      lowerToken === "from" ||
      lowerToken === "from:"
    ) {
      const nextToken = tokens[index + 1];
      const date = nextToken ? extractDatePrefix(nextToken) : null;
      if (date != null) {
        sinceDate = date;
        index += 1;
        continue;
      }
    }

    if (lowerToken === "until" || lowerToken === "until:") {
      const nextToken = tokens[index + 1];
      const date = nextToken ? extractDatePrefix(nextToken) : null;
      if (date != null) {
        untilDate = date;
        index += 1;
        continue;
      }
    }

    if (lowerToken.startsWith("since:") || lowerToken.startsWith("from:")) {
      const date = extractDatePrefix(token.slice(token.indexOf(":") + 1));
      if (date != null) {
        sinceDate = date;
        continue;
      }
    }

    if (lowerToken.startsWith("until:")) {
      const date = extractDatePrefix(token.slice(token.indexOf(":") + 1));
      if (date != null) {
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
}

export const sanitizeSearchText = (input: string): string => {
  const { keywords, sinceDate, untilDate } = parseTokenizedQuery(input);
  const parts: string[] = [];

  if (keywords) {
    parts.push(keywords);
  }
  if (sinceDate) {
    parts.push(`since:${sinceDate}`);
  }
  if (untilDate) {
    parts.push(`until:${untilDate}`);
  }

  return parts.join(" ");
};

export const parseSearchQuery = (query: string) => {
  return parseTokenizedQuery(query);
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d+-\d+-\d+$/.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
