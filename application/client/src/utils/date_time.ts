const JA_LONG_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const JA_HOUR_MINUTE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const toDate = (value: string | number | Date): Date => new Date(value);

export const toISODateTime = (value: string | number | Date): string => toDate(value).toISOString();

export const formatJaLongDate = (value: string | number | Date): string =>
  JA_LONG_DATE_FORMATTER.format(toDate(value));

export const formatJaHourMinute = (value: string | number | Date): string =>
  JA_HOUR_MINUTE_FORMATTER.format(toDate(value));

export const formatJaFromNow = (
  value: string | number | Date,
  baseTime: number = Date.now(),
): string => {
  const targetTime = toDate(value).getTime();
  const deltaSeconds = (targetTime - baseTime) / 1000;
  const absSeconds = Math.abs(deltaSeconds);
  const suffix = deltaSeconds >= 0 ? "後" : "前";

  if (absSeconds < 45) {
    return `数秒${suffix}`;
  }
  if (absSeconds < 90) {
    return `1分${suffix}`;
  }

  const absMinutes = absSeconds / 60;
  if (absMinutes < 45) {
    return `${Math.round(absMinutes)}分${suffix}`;
  }
  if (absMinutes < 90) {
    return `1時間${suffix}`;
  }

  const absHours = absMinutes / 60;
  if (absHours < 22) {
    return `${Math.round(absHours)}時間${suffix}`;
  }
  if (absHours < 36) {
    return `1日${suffix}`;
  }

  const absDays = absHours / 24;
  if (absDays < 26) {
    return `${Math.round(absDays)}日${suffix}`;
  }
  if (absDays < 45) {
    return `1ヶ月${suffix}`;
  }
  if (absDays < 320) {
    return `${Math.round(absDays / 30)}ヶ月${suffix}`;
  }
  if (absDays < 548) {
    return `1年${suffix}`;
  }

  return `${Math.round(absDays / 365)}年${suffix}`;
};