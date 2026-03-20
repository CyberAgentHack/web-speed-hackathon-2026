const jaLongDateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const jaTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 30, unit: "day" },
  { amount: 12, unit: "month" },
  { amount: Infinity, unit: "year" },
];

/**
 * Format a date as Japanese long date (e.g. "2024年1月15日")
 */
export function formatJaLongDate(date: string | Date): string {
  return jaLongDateFormat.format(new Date(date));
}

/**
 * Format a date as HH:mm (e.g. "14:30")
 */
export function formatTime(date: string | Date): string {
  return jaTimeFormat.format(new Date(date));
}

/**
 * Format a date as relative time in Japanese (e.g. "3分前")
 */
export function formatRelativeTime(date: string | Date): string {
  let diff = (new Date(date).getTime() - Date.now()) / 1000;

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(diff) < amount) {
      return rtf.format(Math.round(diff), unit);
    }
    diff /= amount;
  }

  return rtf.format(Math.round(diff), "year");
}
