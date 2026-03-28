const longDateFormatter = new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" });
const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const relativeFormatter = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function formatLongDate(date: Date | string): string {
  return longDateFormatter.format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return timeFormatter.format(new Date(date));
}

export function formatFromNow(date: Date | string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return relativeFormatter.format(-days, "day");
  if (hours > 0) return relativeFormatter.format(-hours, "hour");
  if (minutes > 0) return relativeFormatter.format(-minutes, "minute");
  return relativeFormatter.format(-seconds, "second");
}
