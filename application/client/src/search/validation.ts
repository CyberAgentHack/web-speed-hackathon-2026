import { FormErrors } from "redux-form";

import {
  extractDateFragment,
  parseSearchQuery,
  isValidDate,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { SearchFormData } from "@web-speed-hackathon-2026/client/src/search/types";

export const validate = (values: SearchFormData): FormErrors<SearchFormData> => {
  const errors: FormErrors<SearchFormData> = {};
  const raw = values.searchText?.trim() || "";
  const rawSinceToken = raw.match(/(?:^|\s)since:([^\s]+)/)?.[1] || null;
  const rawUntilToken = raw.match(/(?:^|\s)until:([^\s]+)/)?.[1] || null;
  const sinceToken =
    rawSinceToken == null ? null : (extractDateFragment(rawSinceToken) ?? rawSinceToken);
  const untilToken =
    rawUntilToken == null ? null : (extractDateFragment(rawUntilToken) ?? rawUntilToken);

  if (!raw) {
    errors.searchText = "検索キーワードを入力してください";
    return errors;
  }

  const { keywords, sinceDate, untilDate } = parseSearchQuery(raw);

  if (!keywords && !sinceDate && !untilDate) {
    errors.searchText = "検索キーワードまたは日付範囲を指定してください";
    return errors;
  }

  if (sinceToken && !isValidDate(sinceToken)) {
    errors.searchText = `since: の日付形式が不正です: ${sinceToken}`;
    return errors;
  }

  if (untilToken && !isValidDate(untilToken)) {
    errors.searchText = `until: の日付形式が不正です: ${untilToken}`;
    return errors;
  }

  if (sinceDate && untilDate && sinceDate > untilDate) {
    errors.searchText = "since: は until: より前の日付を指定してください";
    return errors;
  }

  return errors;
};
