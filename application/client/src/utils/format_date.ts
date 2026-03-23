import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

/** moment(date).locale("ja").format("LL") の代替 */
export function formatDateLL(dateStr: string): string {
  return format(new Date(dateStr), "PPP", { locale: ja });
}

/** moment(date).locale("ja").format("HH:mm") の代替 */
export function formatTimeHHmm(dateStr: string): string {
  return format(new Date(dateStr), "HH:mm");
}

/** moment(date).locale("ja").fromNow() の代替 */
export function formatFromNow(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ja });
}
