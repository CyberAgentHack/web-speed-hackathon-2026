import moment from "moment";

export function toISOString(date: string | Date): string {
  return moment(date).toISOString();
}

export function formatLongDate(date: string | Date): string {
  return moment(date).locale("ja").format("LL");
}

export function formatTime(date: string | Date): string {
  return moment(date).locale("ja").format("HH:mm");
}

export function fromNow(date: string | Date): string {
  return moment(date).locale("ja").fromNow();
}
