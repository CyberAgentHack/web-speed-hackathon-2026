import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";

const LIMIT = 30;

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
  const ssrData = useContext(SSRDataContext);
  const ssrValue = ssrData?.[apiPath] as T[] | undefined;
  const skipRef = useRef(ssrValue !== undefined);

  const internalRef = useRef({
    isLoading: false,
    offset: ssrValue !== undefined ? ssrValue.length : 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: ssrValue !== undefined ? ssrValue : [],
    error: null,
    isLoading: ssrValue !== undefined ? false : true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset } = internalRef.current;
    if (isLoading) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
    };

    void fetcher(apiPath).then(
      (allData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...allData.slice(offset, offset + LIMIT)],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + LIMIT,
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
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: false,
      offset: 0,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
