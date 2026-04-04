const jaDateFormat = new Intl.DateTimeFormat("ja", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const jaTimeFormat = new Intl.DateTimeFormat("ja", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const jaRelativeFormat = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function formatDate(date: string | Date): string {
  return jaDateFormat.format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return jaTimeFormat.format(new Date(date));
}

export function toISOString(date: string | Date): string {
  return new Date(date).toISOString();
}

export function fromNow(date: string | Date): string {
  const diff = new Date(date).getTime() - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return jaRelativeFormat.format(Math.round(diff / 1_000), "second");
  if (abs < 3_600_000) return jaRelativeFormat.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return jaRelativeFormat.format(Math.round(diff / 3_600_000), "hour");
  if (abs < 2_592_000_000) return jaRelativeFormat.format(Math.round(diff / 86_400_000), "day");
  if (abs < 31_536_000_000) return jaRelativeFormat.format(Math.round(diff / 2_592_000_000), "month");
  return jaRelativeFormat.format(Math.round(diff / 31_536_000_000), "year");
}
