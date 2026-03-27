interface ParsedSearchQuery {
  keywords: string;
  sinceDate: Date | null;
  untilDate: Date | null;
}

function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const sincePattern = /since:(\d{4}-\d{2}-\d{2})/;
  const untilPattern = /until:(\d{4}-\d{2}-\d{2})/;

  let sinceDate: Date | null = null;
  let untilDate: Date | null = null;

  const sinceMatch = sincePattern.exec(query);
  if (sinceMatch) {
    const date = new Date(sinceMatch[1]!);
    if (isValidDate(date)) {
      date.setHours(0, 0, 0, 0);
      sinceDate = date;
    }
  }

  const untilMatch = untilPattern.exec(query);
  if (untilMatch) {
    const date = new Date(untilMatch[1]!);
    if (isValidDate(date)) {
      date.setHours(23, 59, 59, 999);
      untilDate = date;
    }
  }

  const keywords = query
    .replace(/since:\S*/g, "")
    .replace(/until:\S*/g, "")
    .trim()
    .replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate,
    untilDate,
  };
}
