const DATE_LONG_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const TIME_HM_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

export function toISOString(value: string): string {
  return new Date(value).toISOString();
}

export function formatDateJaLong(value: string): string {
  return DATE_LONG_FORMATTER.format(new Date(value));
}

export function formatTimeJaHM(value: string): string {
  return TIME_HM_FORMATTER.format(new Date(value));
}

export function formatRelativeFromNowJa(value: string): string {
  const targetMs = new Date(value).getTime();
  const nowMs = Date.now();
  const diffSeconds = Math.round((targetMs - nowMs) / 1000);

  if (Math.abs(diffSeconds) < 30) {
    return "たった今";
  }

  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ] as const;

  for (const [unit, unitSeconds] of units) {
    if (Math.abs(diffSeconds) >= unitSeconds) {
      return RELATIVE_FORMATTER.format(Math.round(diffSeconds / unitSeconds), unit);
    }
  }

  return RELATIVE_FORMATTER.format(diffSeconds, "second");
}
