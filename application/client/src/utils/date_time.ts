const dateFormatterJa = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
const timeFormatterJa = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const relativeTimeFormatterJa = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

type DateInput = string | number | Date;

export function toIsoString(input: DateInput): string {
  return new Date(input).toISOString();
}

export function formatJaDate(input: DateInput): string {
  return dateFormatterJa.format(new Date(input));
}

export function formatJaTime(input: DateInput): string {
  return timeFormatterJa.format(new Date(input));
}

export function formatJaRelativeTime(input: DateInput): string {
  const target = new Date(input).getTime();
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return relativeTimeFormatterJa.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  const absMinutes = Math.abs(diffMinutes);
  if (absMinutes < 60) {
    return relativeTimeFormatterJa.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return relativeTimeFormatterJa.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  if (absDays < 30) {
    return relativeTimeFormatterJa.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  const absMonths = Math.abs(diffMonths);
  if (absMonths < 12) {
    return relativeTimeFormatterJa.format(diffMonths, "month");
  }

  const diffYears = Math.round(diffMonths / 12);
  return relativeTimeFormatterJa.format(diffYears, "year");
}
