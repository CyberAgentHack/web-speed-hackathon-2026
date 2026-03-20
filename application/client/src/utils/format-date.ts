import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale/ja";

export const formatDate = (date: string, formatStr: string) => {
  return format(new Date(date), formatStr, { locale: ja });
};

export const formatDateFromNow = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ja });
};
