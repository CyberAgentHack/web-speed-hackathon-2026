import { useEffect, useRef, useState } from "react";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams, setSearchParams] = useState(() => new URLSearchParams(""));
  const lastSearchRef = useRef("");

  useEffect(() => {
    let active = true;

    // Set initial value from window.location on mount
    const initialSearch = window.location.search;
    if (initialSearch !== lastSearchRef.current) {
      lastSearchRef.current = initialSearch;
      setSearchParams(new URLSearchParams(initialSearch));
    }

    const poll = () => {
      if (!active) return;
      const currentSearch = window.location.search;
      if (currentSearch !== lastSearchRef.current) {
        lastSearchRef.current = currentSearch;
        setSearchParams(new URLSearchParams(currentSearch));
      }
      scheduler.postTask(poll, { priority: "user-blocking", delay: 1 });
    };

    scheduler.postTask(poll, { priority: "user-blocking", delay: 1 });

    return () => {
      active = false;
    };
  }, []);

  return [searchParams];
}
