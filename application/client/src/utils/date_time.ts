function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatISODateTime(value: string | Date): string {
  return toDate(value).toISOString();
}

export function formatDateLongJa(value: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(toDate(value));
}

export function formatTime24h(value: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toDate(value));
}

export function formatRelativeTimeJa(value: string | Date): string {
  const date = toDate(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 45) return "数秒前";
  if (seconds < 90) return "1分前";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 45) return `${minutes}分前`;
  if (minutes < 90) return "1時間前";

  const hours = Math.floor(minutes / 60);
  if (hours < 22) return `${hours}時間前`;
  if (hours < 36) return "1日前";

  const days = Math.floor(hours / 24);
  if (days < 25) return `${days}日前`;
  if (days < 45) return "1ヶ月前";

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}ヶ月前`;

  const years = Math.floor(days / 365);
  return years <= 1 ? "1年前" : `${years}年前`;
}
