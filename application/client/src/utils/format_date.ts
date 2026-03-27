const jaDateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const jaTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const jaRelativeFormat = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function formatDateJa(date: string | Date): string {
  return jaDateFormat.format(new Date(date));
}

export function formatTimeJa(date: string | Date): string {
  return jaTimeFormat.format(new Date(date));
}

export function formatRelativeTimeJa(date: string | Date): string {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diffMs = target - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffMs / 60000);
  const diffHour = Math.round(diffMs / 3600000);
  const diffDay = Math.round(diffMs / 86400000);

  if (Math.abs(diffSec) < 60) return jaRelativeFormat.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return jaRelativeFormat.format(diffMin, "minute");
  if (Math.abs(diffHour) < 24) return jaRelativeFormat.format(diffHour, "hour");
  return jaRelativeFormat.format(diffDay, "day");
}
