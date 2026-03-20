const jaLongDate = new Intl.DateTimeFormat("ja-JP", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const jaTime = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
});

const jaRelative = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function toISOString(date: string | Date): string {
  return new Date(date).toISOString();
}

export function formatLongDate(date: string | Date): string {
  return jaLongDate.format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return jaTime.format(new Date(date));
}

export function fromNow(date: string | Date): string {
  const diffMs = new Date(date).getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  if (Math.abs(diffSec) < 60) return jaRelative.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return jaRelative.format(diffMin, "minute");
  const diffHrs = Math.round(diffMin / 60);
  if (Math.abs(diffHrs) < 24) return jaRelative.format(diffHrs, "hour");
  const diffDays = Math.round(diffHrs / 24);
  return jaRelative.format(diffDays, "day");
}
