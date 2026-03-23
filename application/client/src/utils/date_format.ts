const longDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toISOString(value: Date | string): string {
  return toDate(value).toISOString();
}

export function formatLongDateJa(value: Date | string): string {
  return longDateFormatter.format(toDate(value));
}

export function formatTimeJa(value: Date | string): string {
  return timeFormatter.format(toDate(value));
}

export function formatRelativeFromNowJa(value: Date | string): string {
  const target = toDate(value).getTime();
  const diffMs = target - Date.now();

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(diffMs) >= size) {
      return relativeTimeFormatter.format(Math.round(diffMs / size), unit);
    }
  }

  return relativeTimeFormatter.format(Math.round(diffMs / 1000), "second");
}
