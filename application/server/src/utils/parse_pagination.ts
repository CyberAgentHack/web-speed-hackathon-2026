import * as v from "valibot";

const PositiveInt = v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(0));

/**
 * Parse pagination query parameters with valibot.
 * Returns an object with only present keys — `undefined` is never assigned as a value.
 */
export function parsePagination(query: Record<string, string | undefined>): {
  limit?: number;
  offset?: number;
} {
  const result: { limit?: number; offset?: number } = {};
  if (query["limit"] != null) {
    result.limit = v.parse(PositiveInt, query["limit"]);
  }
  if (query["offset"] != null) {
    result.offset = v.parse(PositiveInt, query["offset"]);
  }
  return result;
}
