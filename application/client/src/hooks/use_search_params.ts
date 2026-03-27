import { useEffect, useState } from "react";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(window.location.search),
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function pushState(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    history.replaceState = function replaceState(...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  return [searchParams];
}
