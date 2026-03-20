import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";

export const validate = (values: AuthFormData): Partial<Record<keyof AuthFormData, string>> => {
  const errors: Partial<Record<keyof AuthFormData, string>> = {};

  const normalizedName = values.name?.trim() || "";
  const normalizedPassword = values.password?.trim() || "";
  const normalizedUsername = values.username?.trim() || "";

  if (values.type === "signup" && normalizedName.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (/^(?:[^\P{Letter}&&\P{Number}]*){16,}$/v.test(normalizedPassword)) {
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
