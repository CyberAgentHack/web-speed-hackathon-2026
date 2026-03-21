const longDateFmt = new Intl.DateTimeFormat("ja", { dateStyle: "long" });
const timeFmt = new Intl.DateTimeFormat("ja", { hour: "2-digit", minute: "2-digit", hour12: false });
const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function toISOString(date: string | Date): string {
  return new Date(date).toISOString();
}

export function formatLongDate(date: string | Date): string {
  return longDateFmt.format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return timeFmt.format(new Date(date));
}

export function fromNow(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, "day");
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return rtf.format(-diffMonth, "month");
  const diffYear = Math.round(diffMonth / 12);
  return rtf.format(-diffYear, "year");
}
