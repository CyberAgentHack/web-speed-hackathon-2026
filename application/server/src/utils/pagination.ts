const DEFAULT_LIMIT = 30;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

function parseNonNegativeInteger(rawValue: unknown): number | undefined {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    return undefined;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0) {
    return undefined;
  }

  return value;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export function resolvePagination(
  limitQuery: unknown,
  offsetQuery: unknown,
  options: PaginationOptions = {},
): PaginationParams {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;

  const rawLimit = parseNonNegativeInteger(limitQuery);
  const rawOffset = parseNonNegativeInteger(offsetQuery);

  return {
    limit: rawLimit == null ? defaultLimit : Math.min(rawLimit, maxLimit),
    offset: rawOffset ?? DEFAULT_OFFSET,
  };
}
