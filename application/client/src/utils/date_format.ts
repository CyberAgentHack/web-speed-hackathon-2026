/** 「2025年1月15日」形式 — moment(x).locale("ja").format("LL") 相当 */
export function formatDateLong(input: string): string {
  return new Intl.DateTimeFormat("ja", { dateStyle: "long" }).format(new Date(input));
}

/** 「09:05」形式 — moment(x).locale("ja").format("HH:mm") 相当 */
export function formatTime(input: string): string {
  return new Intl.DateTimeFormat("ja", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(input),
  );
}

/** 「3 時間前」形式 — moment(x).locale("ja").fromNow() 相当 */
export function formatRelativeTime(input: string): string {
  const diff = Date.now() - new Date(input).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const rtf = new Intl.RelativeTimeFormat("ja");
  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  if (minutes > 0) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}
