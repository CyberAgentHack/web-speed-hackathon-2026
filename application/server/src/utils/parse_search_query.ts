interface ParsedSearchQuery {
  keywords: string;
  sinceDate: Date | null;
  untilDate: Date | null;
}

function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

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

export function parseSearchQuery(query: string): ParsedSearchQuery {
  let sinceDate: Date | null = null;
  let untilDate: Date | null = null;
  const keywordTokens: string[] = [];
  const tokens = query.trim().split(/\s+/).filter(Boolean);

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
      const dateText = nextToken ? extractDatePrefix(nextToken) : null;
      if (dateText != null) {
        const date = new Date(dateText);
        if (isValidDate(date)) {
          date.setHours(0, 0, 0, 0);
          sinceDate = date;
          index += 1;
          continue;
        }
      }
    }

    if (lowerToken === "until" || lowerToken === "until:") {
      const nextToken = tokens[index + 1];
      const dateText = nextToken ? extractDatePrefix(nextToken) : null;
      if (dateText != null) {
        const date = new Date(dateText);
        if (isValidDate(date)) {
          date.setHours(23, 59, 59, 999);
          untilDate = date;
          index += 1;
          continue;
        }
      }
    }

    if (lowerToken.startsWith("since:") || lowerToken.startsWith("from:")) {
      const value = token.slice(token.indexOf(":") + 1);
      const dateText = extractDatePrefix(value);
      if (dateText != null) {
        const date = new Date(dateText);
        if (isValidDate(date)) {
          date.setHours(0, 0, 0, 0);
          sinceDate = date;
          continue;
        }
      }
    }

    if (lowerToken.startsWith("until:")) {
      const value = token.slice(token.indexOf(":") + 1);
      const dateText = extractDatePrefix(value);
      if (dateText != null) {
        const date = new Date(dateText);
        if (isValidDate(date)) {
          date.setHours(23, 59, 59, 999);
          untilDate = date;
          continue;
        }
      }
    }

    keywordTokens.push(token);
  }

  const keywords = keywordTokens.join(" ").trim();

  return {
    keywords,
    sinceDate,
    untilDate,
  };
}
