const longDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
});

const shortTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

function toDate(value: string): Date {
  return new Date(value);
}

export function toISOString(value: string): string {
  return toDate(value).toISOString();
}

export function formatLongDate(value: string): string {
  return longDateFormatter.format(toDate(value));
}

export function formatShortTime(value: string): string {
  return shortTimeFormatter.format(toDate(value));
}

export function formatRelativeTime(value: string): string {
  const date = toDate(value);
  const diffMs = date.getTime() - Date.now();
  const absDiffMs = Math.abs(diffMs);

  const units = [
    { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
    { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
    { unit: "day", ms: 24 * 60 * 60 * 1000 },
    { unit: "hour", ms: 60 * 60 * 1000 },
    { unit: "minute", ms: 60 * 1000 },
  ] as const;

  for (const { unit, ms } of units) {
    if (absDiffMs >= ms) {
      return relativeTimeFormatter.format(Math.round(diffMs / ms), unit);
    }
  }

  return relativeTimeFormatter.format(Math.round(diffMs / 1000), "second");
}
