export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export const normalizeUsernameInput = (value: string | null | undefined): string => {
  return (value ?? "").trim().replace(/^@/, "");
};

export const isValidUsername = (value: string | null | undefined): boolean => {
  const normalized = normalizeUsernameInput(value);
  return normalized.length > 0 && USERNAME_PATTERN.test(normalized);
};
