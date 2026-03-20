import { useEffect, useRef, useState } from "react";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const lastSearchRef = useRef(window.location.search);

  useEffect(() => {
    const syncSearchParams = () => {
      const currentSearch = window.location.search;
      if (currentSearch !== lastSearchRef.current) {
        lastSearchRef.current = currentSearch;
        setSearchParams(new URLSearchParams(currentSearch));
      }
    };

    const handlePopState = () => {
      syncSearchParams();
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function (...args) {
      const result = originalPushState(...args);
      syncSearchParams();
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState(...args);
      syncSearchParams();
      return result;
    };

    window.addEventListener("popstate", handlePopState);

    // マウント時点でURLの差分を同期する
    syncSearchParams();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return [searchParams];
}
