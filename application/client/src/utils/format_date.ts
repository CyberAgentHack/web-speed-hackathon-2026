const jaDateFmt = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const jaTimeFmt = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDate(date: string | Date): string {
  return jaDateFmt.format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return jaTimeFmt.format(new Date(date));
}

export function fromNow(date: string | Date): string {
  const diff = new Date(date).getTime() - Date.now();
  const seconds = Math.round(diff / 1000);
  const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(months, "month");
  return rtf.format(Math.round(months / 12), "year");
}
