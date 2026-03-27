import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";

export type NewDirectMessageFormErrors = Partial<Record<keyof NewDirectMessageFormData, string>>;

export const validate = (values: NewDirectMessageFormData): NewDirectMessageFormErrors => {
  const errors: NewDirectMessageFormErrors = {};

  const normalizedUsername = values.username?.trim().replace(/^@/, "") || "";

  if (normalizedUsername.length === 0) {
    errors.username = "ユーザー名を入力してください";
  }

  return errors;
};
