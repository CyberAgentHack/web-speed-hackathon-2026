import { useContext, useEffect, useRef, useState } from "react";

import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";

interface ReturnValues<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T>,
): ReturnValues<T> {
  const ssrData = useContext(SSRDataContext);
  const ssrValue = ssrData?.[apiPath] as T | undefined;
  const skipRef = useRef(ssrValue !== undefined);

  const [result, setResult] = useState<ReturnValues<T>>({
    data: ssrValue !== undefined ? ssrValue : null,
    error: null,
    isLoading: ssrValue !== undefined ? false : true,
  });

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }

    setResult(() => ({
      data: null,
      error: null,
      isLoading: true,
    }));

    void fetcher(apiPath).then(
      (data) => {
        setResult((cur) => ({
          ...cur,
          data,
          isLoading: false,
        }));
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
      },
    );
  }, [apiPath, fetcher]);

  return result;
}
