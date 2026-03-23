let rtf: Intl.RelativeTimeFormat;

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
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

export const formatHM = (date: string | Date): string => {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
