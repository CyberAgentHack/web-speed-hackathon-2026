const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });
const dtfLL = new Intl.DateTimeFormat("ja", { year: "numeric", month: "long", day: "numeric" });
const dtfHm = new Intl.DateTimeFormat("ja", { hour: "2-digit", minute: "2-digit", hour12: false });

export function fromNow(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return rtf.format(-sec, "second");
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.floor(min / 60);
  if (hr < 24) return rtf.format(-hr, "hour");
  const day = Math.floor(hr / 24);
  if (day < 30) return rtf.format(-day, "day");
  const mon = Math.floor(day / 30);
  if (mon < 12) return rtf.format(-mon, "month");
  return rtf.format(-Math.floor(mon / 12), "year");
}

export function formatLL(date: string): string {
  return dtfLL.format(new Date(date));
}

export function formatHm(date: string): string {
  return dtfHm.format(new Date(date));
}

export function toISOString(date: string): string {
  return new Date(date).toISOString();
}
