import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";

export type AuthFormErrors = Partial<Record<keyof AuthFormData, string>>;

const USERNAME_RE = /^[A-Za-z0-9_]*$/;
const LETTER_OR_NUMBER_RE = /^[\p{Letter}\p{Number}]$/u;

const hasSymbolCharacter = (value: string): boolean => {
  for (const char of value) {
    if (!LETTER_OR_NUMBER_RE.test(char)) {
      return true;
    }
  }

  return false;
};

export const validate = (values: AuthFormData): AuthFormErrors => {
  const errors: AuthFormErrors = {};

  const normalizedName = values.name?.trim() || "";
  const normalizedPassword = values.password?.trim() || "";
  const normalizedUsername = values.username?.trim() || "";

  if (values.type === "signup" && normalizedName.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (normalizedPassword.length > 0 && !hasSymbolCharacter(normalizedPassword)) {
    errors.password = "パスワードには記号を含める必要があります";
  }
  if (normalizedPassword.length === 0) {
    errors.password = "パスワードを入力してください";
  }

  if (!USERNAME_RE.test(normalizedUsername)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }
  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
