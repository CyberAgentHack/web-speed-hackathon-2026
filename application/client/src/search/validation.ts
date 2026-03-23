import { FormErrors } from "redux-form";

import {
  parseSearchQuery,
  isValidDate,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { SearchFormData } from "@web-speed-hackathon-2026/client/src/search/types";

export const validate = (values: SearchFormData): FormErrors<SearchFormData> => {
  const errors: FormErrors<SearchFormData> = {};
  const raw = values.searchText?.trim() || "";

  if (!raw) {
    errors.searchText = "検索キーワードを入力してください";
    return errors;
  }

  const { keywords, sinceDate, sinceToken, untilDate, untilToken } = parseSearchQuery(raw);

  if (!keywords && !sinceDate && !untilDate) {
    errors.searchText = "検索キーワードまたは日付範囲を指定してください";
    return errors;
  }

  if (sinceToken && (!sinceDate || !isValidDate(sinceDate))) {
    errors.searchText = `since: の日付形式が不正です: ${sinceToken.replace(/^since:/i, "")}`;
    return errors;
  }

  if (untilToken && (!untilDate || !isValidDate(untilDate))) {
    errors.searchText = `until: の日付形式が不正です: ${untilToken.replace(/^until:/i, "")}`;
    return errors;
  }

  if (sinceDate && untilDate && new Date(sinceDate) > new Date(untilDate)) {
    errors.searchText = "since: は until: より前の日付を指定してください";
    return errors;
  }

  return errors;
};
