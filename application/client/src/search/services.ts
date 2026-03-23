const DATE_PREFIXES = ["since", "until"] as const;

function normalizeDateToken(token: string): string {
  const trimmed = token.trim();

  for (const prefix of ["from", ...DATE_PREFIXES]) {
    const normalizedPrefix = prefix === "from" ? "since" : prefix;
    const lower = trimmed.toLowerCase();

    if (!lower.startsWith(prefix)) {
      continue;
    }

    const remainder = trimmed.slice(prefix.length).replace(/^:/, "");
    const match = /\d{4}-\d{2}-\d{2}/.exec(remainder);
    if (match != null) {
      return `${normalizedPrefix}:${match[0]}`;
    }
  }

  return trimmed;
}

function extractDateToken(token: string, prefix: (typeof DATE_PREFIXES)[number]): string | null {
  const normalizedPrefix = `${prefix}:`;
  if (!token.toLowerCase().startsWith(normalizedPrefix)) {
    return null;
  }

  const candidate = token.slice(normalizedPrefix.length);
  const match = /\d{4}-\d{2}-\d{2}/.exec(candidate);
  return match?.[0] ?? null;
}

export const sanitizeSearchText = (input: string): string => {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeDateToken)
    .join(" ");
};

export const parseSearchQuery = (query: string) => {
  const tokens = query.trim().split(/\s+/).filter(Boolean).map(normalizeDateToken);

  const keywordTokens: string[] = [];
  let sinceDate: string | null = null;
  let sinceToken: string | null = null;
  let untilDate: string | null = null;
  let untilToken: string | null = null;

  for (const token of tokens) {
    if (token.toLowerCase().startsWith("since:")) {
      sinceToken = token;
      sinceDate = extractDateToken(token, "since");
      continue;
    }

    if (token.toLowerCase().startsWith("until:")) {
      untilToken = token;
      untilDate = extractDateToken(token, "until");
      continue;
    }

    keywordTokens.push(token);
  }

  return {
    keywords: keywordTokens.join(" "),
    sinceDate,
    sinceToken,
    untilDate,
    untilToken,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const slowDateLike = /^(\d+)+-(\d+)+-(\d+)+$/;
  if (!slowDateLike.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
