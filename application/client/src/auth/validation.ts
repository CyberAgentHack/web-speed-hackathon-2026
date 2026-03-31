import { FormErrors } from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";

function isAsciiLetterOrDigit(charCode: number): boolean {
  return (
    (charCode >= 48 && charCode <= 57) ||
    (charCode >= 65 && charCode <= 90) ||
    (charCode >= 97 && charCode <= 122)
  );
}

function hasOnlyUsernameChars(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);
    if (charCode !== 95 && !isAsciiLetterOrDigit(charCode)) {
      return false;
    }
  }

  return true;
}

function hasRequiredSymbol(value: string): boolean {
  if (value.length < 16) {
    return true;
  }

  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);
    if (!isAsciiLetterOrDigit(charCode)) {
      return true;
    }
  }

  return false;
}

export const validate = (values: AuthFormData): FormErrors<AuthFormData> => {
  const errors: FormErrors<AuthFormData> = {};

  const normalizedName = values.name?.trim() || "";
  const normalizedPassword = values.password?.trim() || "";
  const normalizedUsername = values.username?.trim() || "";

  if (values.type === "signup" && normalizedName.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (!hasRequiredSymbol(normalizedPassword)) {
    errors.password = "パスワードには記号を含める必要があります";
  }
  if (normalizedPassword.length === 0) {
    errors.password = "パスワードを入力してください";
  }

  if (!hasOnlyUsernameChars(normalizedUsername)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }
  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
