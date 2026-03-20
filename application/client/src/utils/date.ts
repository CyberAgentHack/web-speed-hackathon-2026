const longDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatLongDate(isoString: string): string {
  return longDateFormatter.format(new Date(isoString));
}

export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 45) return "数秒前";
  if (seconds < 90) return "1分前";
  if (minutes < 45) return `${minutes}分前`;
  if (minutes < 90) return "約1時間前";
  if (hours < 22) return `${hours}時間前`;
  if (hours < 36) return "1日前";
  if (days < 26) return `${days}日前`;
  if (days < 45) return "1ヶ月前";
  if (days < 345) return `${months}ヶ月前`;
  if (days < 545) return "1年前";
  return `${years}年前`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
