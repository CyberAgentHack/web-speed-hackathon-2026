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

export function formatDateLong(date: string | Date): string {
  return jaDateFormat.format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return jaTimeFormat.format(new Date(date));
}

export function toISOString(date: string | Date): string {
  return new Date(date).toISOString();
}

export function fromNow(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return jaRelativeFormat.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return jaRelativeFormat.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return jaRelativeFormat.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return jaRelativeFormat.format(-days, "day");
  const months = Math.floor(days / 30);
  if (months < 12) return jaRelativeFormat.format(-months, "month");
  return jaRelativeFormat.format(-Math.floor(days / 365), "year");
}
