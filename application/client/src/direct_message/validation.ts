import type { FormErrors } from "redux-form";

import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";

export const validate = (
  values: NewDirectMessageFormData,
): FormErrors<NewDirectMessageFormData> => {
  const errors: FormErrors<NewDirectMessageFormData> = {};

  const normalizedUsername = values.username?.trim().replace(/^@/, "") || "";

  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
