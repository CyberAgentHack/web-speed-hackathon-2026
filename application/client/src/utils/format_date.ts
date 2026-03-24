export function formatDateLong(date: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });
  const diffMs = new Date(date).getTime() - Date.now();
  const absSec = Math.abs(diffMs / 1000);
  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), "second");
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60000), "minute");
  if (absSec < 86400) return rtf.format(Math.round(diffMs / 3600000), "hour");
  if (absSec < 2592000) return rtf.format(Math.round(diffMs / 86400000), "day");
  if (absSec < 31536000) return rtf.format(Math.round(diffMs / 2592000000), "month");
  return rtf.format(Math.round(diffMs / 31536000000), "year");
}
