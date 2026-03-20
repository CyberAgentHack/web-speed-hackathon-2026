const jaLongDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
});
const jaHourMinuteFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const jaRelativeTimeFormatter = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

const toInstant = (isoLike: string): Temporal.Instant =>
  Temporal.Instant.from(isoLike);

const toDate = (instant: Temporal.Instant): Date =>
  new Date(instant.epochMilliseconds);

export const toIsoDateTime = (isoLike: string): string =>
  toInstant(isoLike).toString();

export const formatJaLongDate = (isoLike: string): string =>
  jaLongDateFormatter.format(toDate(toInstant(isoLike)));

export const formatJaHourMinute = (isoLike: string): string =>
  jaHourMinuteFormatter.format(toDate(toInstant(isoLike)));

export const formatJaRelativeTime = (isoLike: string): string => {
  const targetMs = toInstant(isoLike).epochMilliseconds;
  const nowMs = Temporal.Now.instant().epochMilliseconds;
  const diffSeconds = Math.round((targetMs - nowMs) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return jaRelativeTimeFormatter.format(diffSeconds, "seconds");
  }
  if (absSeconds < 60 * 60) {
    return jaRelativeTimeFormatter.format(
      Math.round(diffSeconds / 60),
      "minutes",
    );
  }
  if (absSeconds < 60 * 60 * 24) {
    return jaRelativeTimeFormatter.format(
      Math.round(diffSeconds / (60 * 60)),
      "hours",
    );
  }
  if (absSeconds < 60 * 60 * 24 * 7) {
    return jaRelativeTimeFormatter.format(
      Math.round(diffSeconds / (60 * 60 * 24)),
      "days",
    );
  }
  if (absSeconds < 60 * 60 * 24 * 30) {
    return jaRelativeTimeFormatter.format(
      Math.round(diffSeconds / (60 * 60 * 24 * 7)),
      "weeks",
    );
  }
  if (absSeconds < 60 * 60 * 24 * 365) {
    return jaRelativeTimeFormatter.format(
      Math.round(diffSeconds / (60 * 60 * 24 * 30)),
      "months",
    );
  }
  return jaRelativeTimeFormatter.format(
    Math.round(diffSeconds / (60 * 60 * 24 * 365)),
    "years",
  );
};
