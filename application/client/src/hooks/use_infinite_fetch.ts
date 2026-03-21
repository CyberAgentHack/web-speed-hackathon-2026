import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";

const LIMIT = 10;

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
  const { data, error, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<T[]>({
      queryKey: ["infiniteFetch", apiPath],
      queryFn: async ({ pageParam }) => {
        const separator = apiPath.includes("?") ? "&" : "?";
        const url = `${apiPath}${separator}limit=${LIMIT}&offset=${pageParam}`;
        return fetcher(url);
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        if (lastPage.length < LIMIT) {
          return undefined;
        }
        return (lastPageParam as number) + LIMIT;
      },
      enabled: apiPath !== "",
    });

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    data: data?.pages.flat() ?? [],
    error: error ?? null,
    isLoading,
    fetchMore,
  };
}
