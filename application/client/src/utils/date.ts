/**
 * 日付を "YYYY年MM月DD日" 形式でフォーマット
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * 日付をISO 8601形式で返す
 */
export function toISOString(date: string | Date): string {
  return new Date(date).toISOString();
}

/**
 * 時刻を "HH:mm" 形式でフォーマット
 */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

/**
 * 相対時間を "〜前" 形式でフォーマット
 */
export function formatRelative(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });
  const now = Date.now();
  const target = new Date(date).getTime();
  const diffMs = target - now;
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, "second");
  }
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }
  return formatDate(date);
}
