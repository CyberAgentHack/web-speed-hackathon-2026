/** moment.js の代替: 軽量日付ユーティリティ */

export function toISOString(dateStr: string): string {
  return new Date(dateStr).toISOString();
}

/** "2025年1月1日" 形式 (moment.locale("ja").format("LL") 相当) */
export function formatLongDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

/** "HH:mm" 形式 (moment.format("HH:mm") 相当) */
export function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

/** "3分前" 形式 (moment.locale("ja").fromNow() 相当) */
export function fromNow(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 45) return "数秒前";
  if (diffMin < 1) return "1分前";
  if (diffMin < 45) return `${diffMin}分前`;
  if (diffHour < 1) return "1時間前";
  if (diffHour < 22) return `${diffHour}時間前`;
  if (diffDay < 1) return "1日前";
  if (diffDay < 26) return `${diffDay}日前`;
  if (diffMonth < 12) return `${diffMonth}ヶ月前`;
  return `${diffYear}年前`;
}
