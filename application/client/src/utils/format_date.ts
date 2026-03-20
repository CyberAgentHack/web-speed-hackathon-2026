const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

export function formatDate(date: string | Date): string {
  return dateFormatter.format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return timeFormatter.format(new Date(date));
}

export function formatFromNow(date: string | Date): string {
  const diffMs = new Date(date).getTime() - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, "second");
  } else if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  } else {
    return rtf.format(diffDays, "day");
  }
}
