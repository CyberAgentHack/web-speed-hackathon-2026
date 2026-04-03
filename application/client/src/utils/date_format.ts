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

/** "2026年1月25日" 形式 (moment の format("LL") 相当) */
export function formatDateLong(dateStr: string): string {
  return dateFormatter.format(new Date(dateStr));
}

/** "14:30" 形式 (moment の format("HH:mm") 相当) */
export function formatTime(dateStr: string): string {
  return timeFormatter.format(new Date(dateStr));
}

/** "3日前" 形式 (moment の fromNow() 相当) */
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

/** ISO 8601 文字列を返す */
export function toISOString(dateStr: string): string {
  return new Date(dateStr).toISOString();
}
