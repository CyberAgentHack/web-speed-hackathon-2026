import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { hasPasswordSymbol } from "@web-speed-hackathon-2026/client/src/utils/password";
import { isValidUsername, normalizeUsernameInput } from "@web-speed-hackathon-2026/client/src/utils/username";

export type AuthFormErrors = Partial<Record<keyof AuthFormData, string>>;

export const validate = (values: AuthFormData): AuthFormErrors => {
  const errors: AuthFormErrors = {};

  const normalizedName = values.name?.trim() || "";
  const normalizedPassword = values.password?.trim() || "";
  const normalizedUsername = normalizeUsernameInput(values.username);

  if (values.type === "signup" && normalizedName.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (values.type === "signup" && normalizedPassword.length > 0 && !hasPasswordSymbol(normalizedPassword)) {
    errors.password = "パスワードには記号を含める必要があります";
  }
  if (normalizedPassword.length === 0) {
    errors.password = "パスワードを入力してください";
  }

  if (normalizedUsername.length > 0 && !isValidUsername(normalizedUsername)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }
  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
