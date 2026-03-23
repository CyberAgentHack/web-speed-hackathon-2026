import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
  appendData: (items: Array<T>) => void;
}

type InternalState<T> = Omit<ReturnValues<T>, "fetchMore" | "appendData">;

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  initialData?: T[],
): ReturnValues<T> {
  const hasInitial = initialData !== undefined && initialData.length > 0;
  const internalRef = useRef({ isLoading: false, offset: hasInitial ? initialData.length : 0 });

  const [result, setResult] = useState<InternalState<T>>({
    data: hasInitial ? initialData : [],
    error: null,
    isLoading: !hasInitial,
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

    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(paginatedPath).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
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

  const initialSkipped = useRef(hasInitial);
  useEffect(() => {
    if (initialSkipped.current) {
      initialSkipped.current = false;
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

  const appendData = useCallback((items: T[]) => {
    setResult((cur) => ({
      ...cur,
      data: [...cur.data, ...items],
    }));
    internalRef.current = {
      ...internalRef.current,
      offset: internalRef.current.offset + items.length,
    };
  }, []);

  return {
    ...result,
    fetchMore,
    appendData,
  };
}
