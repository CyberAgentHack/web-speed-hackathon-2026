export const sanitizeSearchText = (input: string): string => {
  let text = input.trim();

  text = text.replace(
    /\b(since|until)\s*:?\s*(\d{4}-\d{2}-\d{2})[^\s]*/gi,
    (_m, key, date) => `${String(key).toLowerCase()}:${date}`,
  );

  return text.replace(/\s+/g, " ");
};

export const parseSearchQuery = (query: string) => {
  const extractDate = (token: string | null): string | null => {
    if (token == null) {
      return null;
    }
    const matched = /^(\d{4}-\d{2}-\d{2})/.exec(token);
    return matched ? matched[1]! : null;
  };
  const sinceToken = query.match(/\bsince:([^\s]+)/i)?.[1] ?? null;
  const untilToken = query.match(/\buntil:([^\s]+)/i)?.[1] ?? null;
  const keywords = query
    .replace(/\bsince:[^\s]+/gi, "")
    .replace(/\buntil:[^\s]+/gi, "")
    .trim()
    .replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate: extractDate(sinceToken),
    untilDate: extractDate(untilToken),
  };
};

export const isValidDate = (dateStr: string): boolean => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (matched == null) {
    return false;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};
