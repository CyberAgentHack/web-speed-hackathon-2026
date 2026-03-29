const longDateFormatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
});
const relativeTimeFormatter = new Intl.RelativeTimeFormat("ja-JP", { numeric: "auto" });

export function formatLongDate(value: string | Date): string {
  return longDateFormatter.format(new Date(value));
}

export function formatTime(value: string | Date): string {
  return timeFormatter.format(new Date(value));
}

export function formatIsoDate(value: string | Date): string {
  return new Date(value).toISOString();
}

export function formatRelativeTime(value: string | Date): string {
  const target = new Date(value).getTime();
  const diffMs = target - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  if (Math.abs(diffSeconds) < 60) {
    return relativeTimeFormatter.format(diffSeconds, "second");
  }
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return relativeTimeFormatter.format(diffDays, "day");
  }
  if (Math.abs(diffMonths) < 12) {
    return relativeTimeFormatter.format(diffMonths, "month");
  }
  return relativeTimeFormatter.format(diffYears, "year");
}
