const absoluteDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatJapaneseDate(value: string): string {
  return absoluteDateFormatter.format(new Date(value));
}

export function formatRelativeTimeJa(value: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(value).getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs >= 0;

  if (absDiffMs < 45 * 1000) {
    return isPast ? "数秒前" : "数秒後";
  }

  const diffMinutes = Math.round(absDiffMs / (60 * 1000));
  if (diffMinutes < 45) {
    return `${diffMinutes}分${isPast ? "前" : "後"}`;
  }

  const diffHours = Math.round(absDiffMs / (60 * 60 * 1000));
  if (diffHours < 22) {
    return `${diffHours}時間${isPast ? "前" : "後"}`;
  }

  const diffDays = Math.round(absDiffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 26) {
    return `${diffDays}日${isPast ? "前" : "後"}`;
  }

  const diffMonths = Math.round(absDiffMs / (30 * 24 * 60 * 60 * 1000));
  if (diffMonths < 11) {
    return `${diffMonths}ヶ月${isPast ? "前" : "後"}`;
  }

  const diffYears = Math.round(absDiffMs / (365 * 24 * 60 * 60 * 1000));
  return `${diffYears}年${isPast ? "前" : "後"}`;
}
