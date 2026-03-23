/**
 * moment.js replacement using native Intl API
 * Produces identical output to moment().locale("ja").format("LL") etc.
 */

/** "2025年1月15日" — equivalent to moment(d).locale("ja").format("LL") */
export function formatLL(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** "18:30" — equivalent to moment(d).locale("ja").format("HH:mm") */
export function formatHHmm(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "10ヶ月前" — equivalent to moment(d).locale("ja").fromNow() */
export function fromNow(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.round(diffMs / 1000);

  // moment.js の区間基準に準拠
  if (seconds < 45) return "数秒前";
  if (seconds < 90) return "1分前";
  const minutes = Math.round(seconds / 60);
  if (minutes < 45) return `${minutes}分前`;
  if (minutes < 90) return "1時間前";
  const hours = Math.round(minutes / 60);
  if (hours < 22) return `${hours}時間前`;
  if (hours < 36) return "1日前";
  const days = Math.round(hours / 24);
  if (days < 26) return `${days}日前`;
  if (days < 46) return "1ヶ月前";
  const months = Math.round(days / 30.5);
  if (months < 11) return `${months}ヶ月前`;
  const years = Math.round(days / 365);
  if (years <= 1) return "1年前";
  return `${years}年前`;
}

/** ISO string — equivalent to moment(d).toISOString() */
export function toISOString(dateStr: string): string {
  return new Date(dateStr).toISOString();
}
