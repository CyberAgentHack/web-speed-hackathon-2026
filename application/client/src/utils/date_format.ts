const dateFmt = new Intl.DateTimeFormat("ja", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("ja", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

function safeParse(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateStr: string): string {
  const d = safeParse(dateStr);
  return d ? dateFmt.format(d) : "";
}

export function formatTime(dateStr: string): string {
  const d = safeParse(dateStr);
  return d ? timeFmt.format(d) : "";
}

const UNITS: [number, string][] = [
  [60, "秒"],
  [60, "分"],
  [24, "時間"],
  [30.44, "日"],
  [12, "か月"],
  [Infinity, "年"],
];

const THRESHOLDS = [45, 90, 22, 26, 11];

export function timeAgo(dateStr: string): string {
  const d = safeParse(dateStr);
  if (!d) return "";

  const diffMs = Date.now() - d.getTime();
  let val = Math.abs(Math.round(diffMs / 1000));
  const suffix = diffMs >= 0 ? "前" : "後";

  for (let i = 0; i < UNITS.length - 1; i++) {
    const [divisor, unit] = UNITS[i]!;
    if (val < (THRESHOLDS[i] ?? 1)) {
      return `${Math.max(1, val)}${unit}${suffix}`;
    }
    val = Math.round(val / divisor);
  }

  return `${Math.max(1, val)}${UNITS[UNITS.length - 1]![1]}${suffix}`;
}
