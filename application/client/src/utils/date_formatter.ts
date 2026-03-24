// Cache for formatted strings to avoid repeated Intl.DateTimeFormat instantiation
const dateFormatCache = new Map<string, string>();
const timeFormatCache = new Map<string, string>();

// Cached formatters to reduce TBT
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: string): Intl.DateTimeFormat {
  if (!dateFormatters.has(locale)) {
    dateFormatters.set(
      locale,
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  }
  return dateFormatters.get(locale)!;
}

function getTimeFormatter(locale: string): Intl.DateTimeFormat {
  if (!timeFormatters.has(locale)) {
    timeFormatters.set(
      locale,
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    );
  }
  return timeFormatters.get(locale)!;
}

/**
 * Format date to locale-specific format (e.g., "2026年3月21日")
 */
export function formatDate(date: string | Date, locale: string = "ja-JP"): string {
  const dateString = typeof date === "string" ? date : date.toISOString();
  const cacheKey = `${dateString}:${locale}`;

  if (dateFormatCache.has(cacheKey)) {
    return dateFormatCache.get(cacheKey)!;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const formatted = getDateFormatter(locale).format(dateObj);
  dateFormatCache.set(cacheKey, formatted);
  return formatted;
}

/**
 * Format time to HH:mm format
 */
export function formatTime(date: string | Date, locale: string = "ja-JP"): string {
  const dateString = typeof date === "string" ? date : date.toISOString();
  const cacheKey = `${dateString}:${locale}`;

  if (timeFormatCache.has(cacheKey)) {
    return timeFormatCache.get(cacheKey)!;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const formatted = getTimeFormatter(locale).format(dateObj);
  timeFormatCache.set(cacheKey, formatted);
  return formatted;
}

/**
 * Format date as relative time (e.g., "2時間前")
 */
export function formatRelativeTime(date: string | Date, locale: string = "ja"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  // Calculate the appropriate unit and value
  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, "second");
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, "minute");
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return rtf.format(-diffDays, "day");
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return rtf.format(-diffMonths, "month");
  }
  const diffYears = Math.floor(diffMonths / 12);
  return rtf.format(-diffYears, "year");
}
