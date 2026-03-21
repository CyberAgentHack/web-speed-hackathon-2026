const dateFormatterJa = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
const timeFormatterJa = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const relativeFormatterJa = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toISODateString(value: Date | string): string {
  return toDate(value).toISOString();
}

export function formatDateJa(value: Date | string): string {
  return dateFormatterJa.format(toDate(value));
}

export function formatTimeJa(value: Date | string): string {
  return timeFormatterJa.format(toDate(value));
}

export function formatRelativeFromNowJa(value: Date | string): string {
  const target = toDate(value).getTime();
  const now = Date.now();
  const diffSeconds = Math.round((target - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return relativeFormatterJa.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatterJa.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeFormatterJa.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return relativeFormatterJa.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return relativeFormatterJa.format(diffMonths, "month");
  }

  return relativeFormatterJa.format(Math.round(diffMonths / 12), "year");
}