const longDateFormatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ja-JP", { numeric: "auto" });

export function toIsoDateTime(value: string): string {
  return new Date(value).toISOString();
}

export function formatLongDate(value: string): string {
  return longDateFormatter.format(new Date(value));
}

export function formatShortTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

export function formatRelativeTime(value: string): string {
  const deltaSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(deltaSeconds);

  if (absoluteSeconds < 60) {
    return relativeTimeFormatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return relativeTimeFormatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return relativeTimeFormatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  if (Math.abs(deltaDays) < 30) {
    return relativeTimeFormatter.format(deltaDays, "day");
  }

  const deltaMonths = Math.round(deltaDays / 30);
  if (Math.abs(deltaMonths) < 12) {
    return relativeTimeFormatter.format(deltaMonths, "month");
  }

  const deltaYears = Math.round(deltaMonths / 12);
  return relativeTimeFormatter.format(deltaYears, "year");
}
