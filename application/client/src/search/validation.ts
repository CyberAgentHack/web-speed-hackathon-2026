import type { FormErrors } from "redux-form";

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

  const { keywords, sinceDate, untilDate } = parseSearchQuery(raw);

  if (!keywords && !sinceDate && !untilDate) {
    errors.searchText = "検索キーワードまたは日付範囲を指定してください";
    return errors;
  }

  if (sinceDate && !isValidDate(sinceDate)) {
    errors.searchText = `since: の日付形式が不正です: ${sinceDate}`;
    return errors;
  }

  if (untilDate && !isValidDate(untilDate)) {
    errors.searchText = `until: の日付形式が不正です: ${untilDate}`;
    return errors;
  }

  if (sinceDate && untilDate && new Date(sinceDate) > new Date(untilDate)) {
    errors.searchText = "since: は until: より前の日付を指定してください";
    return errors;
  }

  return errors;
};
