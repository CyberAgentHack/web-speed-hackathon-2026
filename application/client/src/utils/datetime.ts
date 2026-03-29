const dateFormatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
});
const relativeTimeFormatter = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toIsoString(value: string | Date): string {
  return toDate(value).toISOString();
}

export function formatJaDate(value: string | Date): string {
  return dateFormatter.format(toDate(value));
}

export function formatJaTime(value: string | Date): string {
  return timeFormatter.format(toDate(value));
}

export function formatJaRelativeFromNow(value: string | Date): string {
  const target = toDate(value).getTime();
  const now = Date.now();
  const diffSeconds = Math.round((target - now) / 1000);
  const abs = Math.abs(diffSeconds);

  if (abs < 60) {
    return relativeTimeFormatter.format(diffSeconds, "second");
  }
  if (abs < 3600) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / 60), "minute");
  }
  if (abs < 86400) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  }
  if (abs < 2592000) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / 86400), "day");
  }
  if (abs < 31536000) {
    return relativeTimeFormatter.format(Math.round(diffSeconds / 2592000), "month");
  }
  return relativeTimeFormatter.format(Math.round(diffSeconds / 31536000), "year");
}
