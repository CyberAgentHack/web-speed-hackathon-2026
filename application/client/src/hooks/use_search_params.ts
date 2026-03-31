import { useEffect, useRef, useState } from "react";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const lastSearchRef = useRef(window.location.search);

  useEffect(() => {
    let active = true;

    const poll = () => {
      if (!active) return;
      const currentSearch = window.location.search;
      if (currentSearch !== lastSearchRef.current) {
        lastSearchRef.current = currentSearch;
        setSearchParams(new URLSearchParams(currentSearch));
      }
      if (typeof scheduler !== "undefined") {
        scheduler.postTask(poll, { priority: "user-blocking", delay: 1 });
      } else {
        setTimeout(poll, 1);
      }
    };

    if (typeof scheduler !== "undefined") {
      scheduler.postTask(poll, { priority: "user-blocking", delay: 1 });
    } else {
      setTimeout(poll, 1);
    }

    return () => {
      active = false;
    };
  }, []);

  return [searchParams];
}
