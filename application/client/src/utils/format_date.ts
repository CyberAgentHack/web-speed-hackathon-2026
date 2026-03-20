const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function formatDateLL(dateStr: string): string {
  return dateFormatter.format(new Date(dateStr));
}

export function formatTime(dateStr: string): string {
  return timeFormatter.format(new Date(dateStr));
}

export function formatFromNow(dateStr: string): string {
  const now = Date.now();
  const diff = new Date(dateStr).getTime() - now;
  const absDiffSec = Math.abs(diff) / 1000;

  if (absDiffSec < 60) return rtf.format(Math.round(diff / 1000), "second");
  if (absDiffSec < 3600) return rtf.format(Math.round(diff / 60000), "minute");
  if (absDiffSec < 86400) return rtf.format(Math.round(diff / 3600000), "hour");
  if (absDiffSec < 2592000) return rtf.format(Math.round(diff / 86400000), "day");
  if (absDiffSec < 31536000) return rtf.format(Math.round(diff / 2592000000), "month");
  return rtf.format(Math.round(diff / 31536000000), "year");
}
