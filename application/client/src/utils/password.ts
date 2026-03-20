const PASSWORD_SYMBOL_PATTERN = /[\p{P}\p{S}]/u;

export const hasPasswordSymbol = (value: string | null | undefined): boolean => {
  return PASSWORD_SYMBOL_PATTERN.test((value ?? "").trim());
};
