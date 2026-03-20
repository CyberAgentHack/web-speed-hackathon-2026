import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ja";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export function toIsoString(value: string | number | Date): string {
  return dayjs(value).toISOString();
}

export function formatDateJa(value: string | number | Date): string {
  return dayjs(value).locale("ja").format("LL");
}

export function formatTimeJa(value: string | number | Date): string {
  return dayjs(value).locale("ja").format("HH:mm");
}

export function fromNowJa(value: string | number | Date): string {
  return dayjs(value).locale("ja").fromNow();
}
