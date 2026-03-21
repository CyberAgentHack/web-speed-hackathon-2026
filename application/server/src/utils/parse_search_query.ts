interface ParsedSearchQuery {
  keywords: string;
  sinceDate: Date | null;
  untilDate: Date | null;
}

function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const sincePattern = /\bsince:([^\s]+)/i;
  const untilPattern = /\buntil:([^\s]+)/i;
  const datePattern = /^(\d{4}-\d{2}-\d{2})/;

  let sinceDate: Date | null = null;
  let untilDate: Date | null = null;

  const sinceMatch = sincePattern.exec(query);
  const sinceToken = sinceMatch?.[1] ?? null;
  const sinceDatePart = sinceToken ? datePattern.exec(sinceToken)?.[1] : null;
  if (sinceDatePart) {
    const date = new Date(sinceDatePart);
    if (isValidDate(date)) {
      date.setHours(0, 0, 0, 0);
      sinceDate = date;
    }
  }

  const untilMatch = untilPattern.exec(query);
  const untilToken = untilMatch?.[1] ?? null;
  const untilDatePart = untilToken ? datePattern.exec(untilToken)?.[1] : null;
  if (untilDatePart) {
    const date = new Date(untilDatePart);
    if (isValidDate(date)) {
      date.setHours(23, 59, 59, 999);
      untilDate = date;
    }
  }

  const keywords = query
    .replace(/\bsince:[^\s]+/gi, "")
    .replace(/\buntil:[^\s]+/gi, "")
    .trim()
    .replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate,
    untilDate,
  };
}
