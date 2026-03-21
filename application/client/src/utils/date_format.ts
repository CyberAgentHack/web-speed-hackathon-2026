let llFormatter: Intl.DateTimeFormat;
let hmFormatter: Intl.DateTimeFormat;
let rtf: Intl.RelativeTimeFormat;

function getLLFormatter() {
  return (llFormatter ??= new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }));
}

function getHMFormatter() {
  return (hmFormatter ??= new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }));
}

function getRTF() {
  return (rtf ??= new Intl.RelativeTimeFormat("ja", { numeric: "always" }));
}

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 30, unit: "day" },
  { amount: 12, unit: "month" },
  { amount: Infinity, unit: "year" },
];

export const formatLL = (date: string | Date): string => {
  return getLLFormatter().format(new Date(date));
};

export const formatHM = (date: string | Date): string => {
  return getHMFormatter().format(new Date(date));
};

export const formatFromNow = (date: string | Date): string => {
  let diff = (new Date(date).getTime() - Date.now()) / 1000;

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(diff) < amount) {
      return getRTF().format(Math.round(diff), unit);
    }
    diff /= amount;
  }

  return getRTF().format(Math.round(diff), "year");
};
