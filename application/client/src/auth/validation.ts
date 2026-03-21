import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";

export type AuthFormErrors = Partial<Record<keyof AuthFormData, string>>;

function isAsciiAlphaNumericOnly(value: string) {
  if (value.length === 0) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isNumber = code >= 48 && code <= 57;
    const isUppercase = code >= 65 && code <= 90;
    const isLowercase = code >= 97 && code <= 122;

    if (!isNumber && !isUppercase && !isLowercase) {
      return false;
    }
  }

  return true;
}

export const validate = (values: AuthFormData): AuthFormErrors => {
  const errors: AuthFormErrors = {};

  const normalizedName = values.name?.trim() || "";
  const normalizedPassword = values.password?.trim() || "";
  const normalizedUsername = values.username?.trim() || "";

  if (values.type === "signup" && normalizedName.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (isAsciiAlphaNumericOnly(normalizedPassword)) {
    errors.password = "パスワードには記号を含める必要があります";
  }
  if (normalizedPassword.length === 0) {
    errors.password = "パスワードを入力してください";
  }

  if (!/^[a-zA-Z0-9_]*$/.test(normalizedUsername)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }
  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
