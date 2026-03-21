import { useEffect, useRef, useState } from "react";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const lastSearchRef = useRef(window.location.search);

  useEffect(() => {
    const handler = () => {
      const currentSearch = window.location.search;
      if (currentSearch !== lastSearchRef.current) {
        lastSearchRef.current = currentSearch;
        setSearchParams(new URLSearchParams(currentSearch));
      }
    };

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      originalPushState(...args);
      handler();
    };
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      originalReplaceState(...args);
      handler();
    };

    window.addEventListener("popstate", handler);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handler);
    };
  }, []);

  return [searchParams];
}
