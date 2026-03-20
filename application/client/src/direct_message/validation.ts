import { FormErrors } from "redux-form";

import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { isValidUsername, normalizeUsernameInput } from "@web-speed-hackathon-2026/client/src/utils/username";

export const validate = (
  values: NewDirectMessageFormData,
): FormErrors<NewDirectMessageFormData> => {
  const errors: FormErrors<NewDirectMessageFormData> = {};

  const normalizedUsername = normalizeUsernameInput(values.username);

  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  } else if (!isValidUsername(normalizedUsername)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }

  return errors;
};
