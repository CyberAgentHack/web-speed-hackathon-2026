const DATE_LOCALE = "ja-JP";

const dateFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { dateStyle: "long" });
const timeFormatter = new Intl.DateTimeFormat(DATE_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const relativeTimeFormatter = new Intl.RelativeTimeFormat(DATE_LOCALE, { numeric: "auto" });

const RELATIVE_TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; milliseconds: number }> = [
  { unit: "year", milliseconds: 1000 * 60 * 60 * 24 * 365 },
  { unit: "month", milliseconds: 1000 * 60 * 60 * 24 * 30 },
  { unit: "week", milliseconds: 1000 * 60 * 60 * 24 * 7 },
  { unit: "day", milliseconds: 1000 * 60 * 60 * 24 },
  { unit: "hour", milliseconds: 1000 * 60 * 60 },
  { unit: "minute", milliseconds: 1000 * 60 },
  { unit: "second", milliseconds: 1000 },
];

function toValidDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODateTime(value: Date | string): string {
  const date = toValidDate(value);
  return date === null ? String(value) : date.toISOString();
}

export function formatJapaneseDate(value: Date | string): string {
  const date = toValidDate(value);
  return date === null ? String(value) : dateFormatter.format(date);
}

export function formatJapaneseTime(value: Date | string): string {
  const date = toValidDate(value);
  return date === null ? String(value) : timeFormatter.format(date);
}

export function formatRelativeTimeFromNow(value: Date | string, now = new Date()): string {
  const date = toValidDate(value);
  if (date === null) {
    return String(value);
  }

  const diffMilliseconds = date.getTime() - now.getTime();
  const absDiffMilliseconds = Math.abs(diffMilliseconds);

  for (const { unit, milliseconds } of RELATIVE_TIME_UNITS) {
    if (absDiffMilliseconds >= milliseconds || unit === "second") {
      return relativeTimeFormatter.format(Math.round(diffMilliseconds / milliseconds), unit);
    }
  }

  return relativeTimeFormatter.format(0, "second");
}
