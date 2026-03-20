const longDateFormatter = new Intl.DateTimeFormat("ja", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ja", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const relativeFormatter = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function formatLongDate(dateStr: string): string {
  return longDateFormatter.format(new Date(dateStr));
}

export function formatTime(dateStr: string): string {
  return timeFormatter.format(new Date(dateStr));
}

export function formatFromNow(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return relativeFormatter.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return relativeFormatter.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return relativeFormatter.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return relativeFormatter.format(-days, "day");
  const months = Math.floor(days / 30);
  if (months < 12) return relativeFormatter.format(-months, "month");
  const years = Math.floor(months / 12);
  return relativeFormatter.format(-years, "year");
}
