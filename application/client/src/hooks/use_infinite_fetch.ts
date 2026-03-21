import { useCallback, useEffect, useRef, useState } from "react";

import { consumeBootstrapData, peekBootstrapData } from "@web-speed-hackathon-2026/client/src/utils/bootstrap_data";

const DEFAULT_LIMIT = 12;

interface Options {
  enabled?: boolean;
  limit?: number;
}

function createRequestPath(apiPath: string, limit: number, offset: number) {
  const requestUrl = new URL(apiPath, window.location.origin);
  requestUrl.searchParams.set("limit", String(limit));
  requestUrl.searchParams.set("offset", String(offset));
  return `${requestUrl.pathname}${requestUrl.search}`;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  hasMore: boolean;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  { enabled = true, limit = DEFAULT_LIMIT }: Options = {},
): ReturnValues<T> {
  const initialRequestPath = apiPath && enabled ? createRequestPath(apiPath, limit, 0) : "";
  const initialBootstrapData =
    initialRequestPath !== "" ? peekBootstrapData<T[]>(initialRequestPath) : null;
  const initialHasMore = initialBootstrapData !== null ? initialBootstrapData.length === limit : true;
  const internalRef = useRef({
    hasMore: initialBootstrapData !== null ? initialHasMore : true,
    isLoading: false,
    offset: initialBootstrapData?.length ?? 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>(() => ({
    data: initialBootstrapData ?? [],
    error: null,
    hasMore: initialBootstrapData !== null ? initialHasMore : true,
    isLoading: apiPath !== "" && enabled && initialBootstrapData === null,
  }));

  const buildRequestPath = useCallback(
    (offset: number) => {
      return createRequestPath(apiPath, limit, offset);
    },
    [apiPath, limit],
  );

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
    if (!apiPath || !enabled || isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
    };

    const requestPath = buildRequestPath(offset);

    void fetcher(requestPath).then(
      (pageData) => {
        const nextHasMore = pageData.length === limit;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          hasMore: nextHasMore,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: nextHasMore,
          isLoading: false,
          offset: offset + pageData.length,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, buildRequestPath, enabled, fetcher, limit]);

  useEffect(() => {
    if (!apiPath || !enabled) {
      setResult(() => ({
        data: [],
        error: null,
        hasMore: false,
        isLoading: false,
      }));
      internalRef.current = {
        hasMore: false,
        isLoading: false,
        offset: 0,
      };
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      hasMore: true,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore: true,
      isLoading: false,
      offset: 0,
    };

    const bootstrapData = consumeBootstrapData<T[]>(buildRequestPath(0));
    if (bootstrapData !== null) {
      const nextHasMore = bootstrapData.length === limit;
      setResult((current) => {
        if (
          current.data === bootstrapData ||
          (current.data.length === bootstrapData.length && current.error === null && !current.isLoading)
        ) {
          return {
            ...current,
            hasMore: nextHasMore,
            isLoading: false,
          };
        }

        return {
          data: bootstrapData,
          error: null,
          hasMore: nextHasMore,
          isLoading: false,
        };
      });
      internalRef.current = {
        hasMore: nextHasMore,
        isLoading: false,
        offset: bootstrapData.length,
      };
      return;
    }

    fetchMore();
  }, [apiPath, buildRequestPath, enabled, fetchMore, limit]);

  return {
    ...result,
    fetchMore,
  };
}
