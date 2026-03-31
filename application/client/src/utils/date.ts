const longDateFormatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
const timeFormatter = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" });
const relativeFormatter = new Intl.RelativeTimeFormat("ja-JP", { numeric: "auto" });

function ensureDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateLong(value: string | number | Date): string {
  return longDateFormatter.format(ensureDate(value));
}

export function formatTimeHM(value: string | number | Date): string {
  return timeFormatter.format(ensureDate(value));
}

export function formatRelativeTime(value: string | number | Date): string {
  const target = ensureDate(value).getTime();
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return relativeFormatter.format(diffSeconds, "second");
  }
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return relativeFormatter.format(diffDays, "day");
  }
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return relativeFormatter.format(diffMonths, "month");
  }
  const diffYears = Math.round(diffMonths / 12);
  return relativeFormatter.format(diffYears, "year");
}
