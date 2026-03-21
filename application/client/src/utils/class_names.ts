type ClassDictionary = Record<string, unknown>;
type ClassValue = ClassDictionary | ClassValue[] | null | undefined | boolean | number | string;

const appendClassNames = (values: ClassValue[], result: string[]) => {
  values.forEach((value) => {
    if (!value) {
      return;
    }

    if (typeof value === "string" || typeof value === "number") {
      result.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      appendClassNames(value, result);
      return;
    }

    Object.entries(value).forEach(([className, enabled]) => {
      if (enabled) {
        result.push(className);
      }
    });
  });
};

export const classNames = (...values: ClassValue[]) => {
  const result: string[] = [];

  appendClassNames(values, result);

  return result.join(" ");
};
