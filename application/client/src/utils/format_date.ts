const jaDateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const jaTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatDateLong(dateStr: string): string {
  return jaDateFormat.format(new Date(dateStr));
}

export function formatTime(dateStr: string): string {
  return jaTimeFormat.format(new Date(dateStr));
}

export function formatFromNow(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();

  if (diff < MINUTE) {
    return "数秒前";
  }
  if (diff < HOUR) {
    return `${Math.floor(diff / MINUTE)}分前`;
  }
  if (diff < DAY) {
    return `${Math.floor(diff / HOUR)}時間前`;
  }
  if (diff < MONTH) {
    return `${Math.floor(diff / DAY)}日前`;
  }
  if (diff < YEAR) {
    return `${Math.floor(diff / MONTH)}ヶ月前`;
  }
  return `${Math.floor(diff / YEAR)}年前`;
}

export function toISOString(dateStr: string): string {
  return new Date(dateStr).toISOString();
}
