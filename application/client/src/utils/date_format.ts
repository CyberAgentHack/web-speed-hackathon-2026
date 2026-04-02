const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
const TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function toISOString(value: string | number | Date): string {
  return toDate(value).toISOString();
}

export function formatDateJa(value: string | number | Date): string {
  return LONG_DATE_FORMATTER.format(toDate(value));
}

export function formatTimeJa(value: string | number | Date): string {
  return TIME_FORMATTER.format(toDate(value));
}

export function formatRelativeFromNowJa(value: string | number | Date): string {
  const diffSeconds = Math.round((toDate(value).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);

  if (abs < 60) return RELATIVE_TIME_FORMATTER.format(diffSeconds, "second");
  if (abs < 3600) return RELATIVE_TIME_FORMATTER.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return RELATIVE_TIME_FORMATTER.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 2592000) return RELATIVE_TIME_FORMATTER.format(Math.round(diffSeconds / 86400), "day");
  if (abs < 31536000)
    return RELATIVE_TIME_FORMATTER.format(Math.round(diffSeconds / 2592000), "month");
  return RELATIVE_TIME_FORMATTER.format(Math.round(diffSeconds / 31536000), "year");
}
