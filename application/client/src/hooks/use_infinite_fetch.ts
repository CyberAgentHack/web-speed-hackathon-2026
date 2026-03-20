import { useCallback, useMemo } from "react";
import useSWRInfinite, { SWRInfiniteKeyLoader } from "swr/infinite";

const LIMIT = 30;
const EMPTY_LIST: [] = [];

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

interface Options<T> {
  initialData?: Array<T>;
  limit?: number;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options?: Options<T>,
): ReturnValues<T> {
  const initialData = options?.initialData ?? EMPTY_LIST;
  const hasInitialData = initialData.length > 0;
  const limit = options?.limit ?? LIMIT;

  const getKey: SWRInfiniteKeyLoader = (index) => {
    if (apiPath === "") {
      return null;
    }
    return buildPaginatedPath(apiPath, index * limit, limit);
  };

  const { data, error, isLoading, setSize } = useSWRInfinite(
    getKey,
    fetcher,
    {
      fallbackData: hasInitialData ? [initialData] : undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    },
  );

  const flatData = useMemo(() => {
    if (data) {
      return data.reduce((acc: T[], page: T[]) => [...acc, ...page], []);
    }
    return hasInitialData ? initialData : [];
  }, [data, hasInitialData, initialData]);

  const hasMore = useMemo(() => {
    if (apiPath === "") {
      return false;
    }

    if (data == null) {
      return true;
    }

    const lastPage = data[data.length - 1];
    if (lastPage == null) {
      return false;
    }

    return lastPage.length === limit;
  }, [apiPath, data, limit]);

  const fetchMore = useCallback(() => {
    if (apiPath === "") {
      return;
    }

    if (!hasMore || isLoading) {
      return;
    }

    void setSize((prev) => prev + 1);
  }, [apiPath, hasMore, isLoading, setSize]);

  return {
    data: flatData,
    error: error ?? null,
    isLoading: isLoading || (data === undefined && hasInitialData === false),
    fetchMore,
  };
}
