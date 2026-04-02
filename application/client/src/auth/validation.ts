import { FormErrors } from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";

export const validate = (values: AuthFormData): FormErrors<AuthFormData> => {
  const errors: FormErrors<AuthFormData> = {};

  const normalizedName = values.name?.trim() || "";
  const normalizedPassword = values.password?.trim() || "";
  const normalizedUsername = values.username?.trim() || "";

  if (values.type === "signup" && normalizedName.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (values.type === "signup" && /^(?:[^\P{Letter}&&\P{Number}]*){16,}$/v.test(normalizedPassword)) {
    errors.password = "パスワードには記号を含める必要があります";
  }
  if (values.type === "signup" && normalizedPassword.length === 0) {
    errors.password = "パスワードを入力してください";
  }

  if (values.type === "signup" && !/^[a-zA-Z0-9_]*$/.test(normalizedUsername)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }
  if (values.type === "signup" && normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
