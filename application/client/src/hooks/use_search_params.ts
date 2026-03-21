import { useCallback, useEffect, useRef, useState } from "react";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const lastSearchRef = useRef(window.location.search);

  const sync = useCallback(() => {
    const currentSearch = window.location.search;
    if (currentSearch !== lastSearchRef.current) {
      lastSearchRef.current = currentSearch;
      setSearchParams(new URLSearchParams(currentSearch));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", sync);

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      originalPushState(...args);
      sync();
    };
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      originalReplaceState(...args);
      sync();
    };

    return () => {
      window.removeEventListener("popstate", sync);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [sync]);

  return [searchParams];
}
