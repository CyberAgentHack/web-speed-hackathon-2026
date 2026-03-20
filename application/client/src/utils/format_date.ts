const llFormatter = new Intl.DateTimeFormat("ja", { year: "numeric", month: "long", day: "numeric" });
const hmFormatter = new Intl.DateTimeFormat("ja", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatLL(date: string): string {
  return llFormatter.format(new Date(date));
}

export function formatHHmm(date: string): string {
  return hmFormatter.format(new Date(date));
}

export function fromNow(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}ヶ月前`;
  const years = Math.floor(days / 365);
  return `${years}年前`;
}
