const jaDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const jaTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function toIsoString(value: string): string {
  return new Date(value).toISOString();
}

export function formatDateJa(value: string): string {
  return jaDateFormatter.format(new Date(value));
}

export function formatTimeJa(value: string): string {
  return jaTimeFormatter.format(new Date(value));
}

export function formatFromNowJa(value: string): string {
  const date = new Date(value);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const isPast = diffSeconds < 0;
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return isPast ? "たった今" : "数秒後";
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    const minutes = Math.abs(diffMinutes);
    return isPast ? `${minutes}分前` : `${minutes}分後`;
  }

  const diffHours = Math.round(diffSeconds / 3600);
  if (Math.abs(diffHours) < 24) {
    const hours = Math.abs(diffHours);
    return isPast ? `${hours}時間前` : `${hours}時間後`;
  }

  const diffDays = Math.round(diffSeconds / 86400);
  if (Math.abs(diffDays) < 7) {
    const days = Math.abs(diffDays);
    return isPast ? `${days}日前` : `${days}日後`;
  }

  const diffWeeks = Math.round(diffSeconds / 604800);
  if (Math.abs(diffWeeks) < 4) {
    const weeks = Math.abs(diffWeeks);
    return isPast ? `${weeks}週間前` : `${weeks}週間後`;
  }

  const diffMonths = Math.round(diffSeconds / 2629800);
  if (Math.abs(diffMonths) < 12) {
    const months = Math.abs(diffMonths);
    return isPast ? `${months}か月前` : `${months}か月後`;
  }

  const diffYears = Math.round(diffSeconds / 31557600);
  const years = Math.abs(diffYears);
  return isPast ? `${years}年前` : `${years}年後`;
}
