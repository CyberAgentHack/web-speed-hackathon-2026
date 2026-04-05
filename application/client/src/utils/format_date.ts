/**
 * moment(date).locale("ja").format("LL") の代替
 * 出力例: "2026年3月20日"
 */
export function formatDateJa(dateStr: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

/**
 * moment(date).locale("ja").format("HH:mm") の代替
 * 出力例: "14:30"
 */
export function formatTimeHHmm(dateStr: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

/**
 * moment(date).locale("ja").fromNow() の代替
 * moment の ja ロケールの閾値に合わせている
 * 出力例: "3分前", "2時間前", "5日前"
 */
export function fromNowJa(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 45) return "数秒前";
  if (diffMin < 2) return "1分前";
  if (diffMin < 45) return `${diffMin}分前`;
  if (diffHour < 2) return "1時間前";
  if (diffHour < 22) return `${diffHour}時間前`;
  if (diffDay < 2) return "1日前";
  if (diffDay < 26) return `${diffDay}日前`;
  if (diffMonth < 2) return "1ヶ月前";
  if (diffMonth < 12) return `${diffMonth}ヶ月前`;
  if (diffYear < 2) return "1年前";
  return `${diffYear}年前`;
}
