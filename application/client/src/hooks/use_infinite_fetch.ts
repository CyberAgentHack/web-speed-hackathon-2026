import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

// クライアント側でのメモリキャッシュ
const globalCache = new Map<string, any[]>();

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
  hasMore: boolean;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  // キャッシュがあればそれを初期値にする
  const cachedData = apiPath ? globalCache.get(apiPath) || [] : [];
  
  const internalRef = useRef({ 
    isLoading: false, 
    offset: cachedData.length, 
    hasMore: true 
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: cachedData,
    error: null,
    isLoading: cachedData.length === 0, // キャッシュがあればロード中ではない
    hasMore: true,
  });

  const fetchMore = useCallback((isInitial = false) => {
    const { isLoading, offset, hasMore } = internalRef.current;
    
    // 初回フェッチ以外で、ロード中またはこれ以上データがない場合はスキップ
    if (!isInitial && (isLoading || !hasMore)) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current.isLoading = true;

    const currentOffset = isInitial ? 0 : offset;
    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${LIMIT}&offset=${currentOffset}`;

    void fetcher(paginatedPath).then(
      (newData) => {
        const nextHasMore = newData.length === LIMIT;
        
        setResult((cur) => {
          const combinedData = isInitial ? newData : [...cur.data, ...newData];
          // キャッシュを更新
          if (apiPath) {
            globalCache.set(apiPath, combinedData);
          }
          return {
            ...cur,
            data: combinedData,
            isLoading: false,
            hasMore: nextHasMore,
          };
        });

        internalRef.current = {
          isLoading: false,
          offset: currentOffset + LIMIT,
          hasMore: nextHasMore,
        };
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

  useEffect(() => {
    // 既にデータがある場合（キャッシュヒット時）でも、最新を確認するために一度フェッチする
    // ただし、画面がチラつかないように裏側で実行される
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };
    fetchMore(true);
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}

