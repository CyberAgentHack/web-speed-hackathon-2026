/**
 * moment(date).locale("ja").format("LL") の代替
 * → "2026年1月28日"
 */
export function formatDateLong(date: string | Date): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * moment(date).locale("ja").format("HH:mm") の代替
 * → "20:34"
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * moment(date).locale("ja").fromNow() の代替
 * → "2ヶ月前", "3日前", "1時間前", "たった今"
 */
export function fromNow(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "たった今";

  const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, "minute");

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return rtf.format(-diffHour, "hour");

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return rtf.format(-diffDay, "day");

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return rtf.format(-diffMonth, "month");

  const diffYear = Math.floor(diffMonth / 12);
  return rtf.format(-diffYear, "year");
}
