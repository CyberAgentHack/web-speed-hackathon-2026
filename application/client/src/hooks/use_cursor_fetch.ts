import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 24;

interface CursorResponse<T> {
  posts: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useCursorFetch<T>(
  apiPath: string,
  fetcher: (url: string) => Promise<CursorResponse<T>>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, nextCursor: null as string | null, hasMore: true });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, hasMore, nextCursor } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({ ...cur, isLoading: true }));
    internalRef.current = { ...internalRef.current, isLoading: true };

    const separator = apiPath.includes("?") ? "&" : "?";
    const url = nextCursor
      ? `${apiPath}${separator}limit=${PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`
      : `${apiPath}${separator}limit=${PAGE_SIZE}`;

    void fetcher(url).then(
      (response) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...response.posts],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = { ...internalRef.current, isLoading: false };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    setResult({ data: [], error: null, isLoading: true });
    internalRef.current = { isLoading: false, nextCursor: null, hasMore: true };
    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
