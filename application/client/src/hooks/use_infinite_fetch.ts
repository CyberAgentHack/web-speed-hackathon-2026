import { useCallback, useEffect, useRef, useState } from "react";

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
  const internalRef = useRef({
    isLoading: false,
    offset: 0,
    hasMore: true,
  });
  console.log("🔥 useInfiniteFetch loaded");

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;

    // 🔥 二重リクエスト防止 & もうデータない場合は止める
    if (isLoading || !hasMore) return;

    internalRef.current.isLoading = true;

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));

    const url = `${apiPath}?limit=${LIMIT}&offset=${offset}`;
    console.log("🚀 fetch:", url);

    void fetcher(url).then(
      (newData) => {
        // 🔥 データがLIMIT未満ならもう次はない
        if (newData.length < LIMIT) {
          internalRef.current.hasMore = false;
        }

        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...newData],
          isLoading: false,
        }));

        internalRef.current.offset += LIMIT;
        internalRef.current.isLoading = false;
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));

        internalRef.current.isLoading = false;
      },
    );
  }, [apiPath, fetcher]);

  // 初回ロード
  useEffect(() => {
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };

    setResult({
      data: [],
      error: null,
      isLoading: true,
    });

    fetchMore();
  }, []);

  return {
    ...result,
    fetchMore,
  };
}