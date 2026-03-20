import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

function buildPaginatedPath(
  apiPath: string,
  offset: number,
  limit: number,
): string {
  const [rawPath, rawQuery = ""] = apiPath.split("?");
  const path = rawPath ?? "";
  const params = new URLSearchParams(rawQuery);

  params.set("offset", String(offset));
  params.set("limit", String(limit));

  const query = params.toString();
  return query === "" ? path : `${path}?${query}`;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore || apiPath === "") {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      hasMore,
    };

    void fetcher(buildPaginatedPath(apiPath, offset, LIMIT)).then(
      (pageData) => {
        const nextOffset = offset + pageData.length;
        const nextHasMore = pageData.length === LIMIT;

        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: nextOffset,
          hasMore: nextHasMore,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset,
          hasMore,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };

    if (apiPath !== "") {
      fetchMore();
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      isLoading: false,
    }));
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
