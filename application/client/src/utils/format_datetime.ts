const jaDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatJaDate(value: Date | string): string {
  return jaDateFormatter.format(toDate(value));
}

export function toIsoDateTime(value: Date | string): string {
  return toDate(value).toISOString();
}
