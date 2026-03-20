import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

export function useSearchParams(): [URLSearchParams] {
  const location = useLocation();
  const [searchParams, setSearchParams] = useState(
    () =>
      new URLSearchParams(typeof window !== "undefined" ? window.location.search : location.search),
  );
  const lastSearchRef = useRef(
    typeof window !== "undefined" ? window.location.search : location.search,
  );

  useEffect(() => {
    let active = true;

    const poll = () => {
      if (!active) return;
      const currentSearch = window.location.search;
      if (currentSearch !== lastSearchRef.current) {
        lastSearchRef.current = currentSearch;
        setSearchParams(new URLSearchParams(currentSearch));
      }
      void scheduler.postTask(poll, { priority: "user-blocking", delay: 1 });
    };

    void scheduler.postTask(poll, { priority: "user-blocking", delay: 1 });

    return () => {
      active = false;
    };
  }, []);

  return [searchParams];
}
