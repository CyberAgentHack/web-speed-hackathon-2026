import { useEffect, useRef, useState } from "react";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const lastSearchRef = useRef(window.location.search);

  useEffect(() => {
    const handleChange = () => {
      const currentSearch = window.location.search;
      if (currentSearch !== lastSearchRef.current) {
        lastSearchRef.current = currentSearch;
        setSearchParams(new URLSearchParams(currentSearch));
      }
    };

    // popstate: ブラウザの戻る/進む
    window.addEventListener("popstate", handleChange);

    // pushState/replaceState: React Router等のプログラム的なURL変更を検知
    const origPushState = history.pushState.bind(history);
    const origReplaceState = history.replaceState.bind(history);
    history.pushState = (...args) => {
      origPushState(...args);
      handleChange();
    };
    history.replaceState = (...args) => {
      origReplaceState(...args);
      handleChange();
    };

    return () => {
      window.removeEventListener("popstate", handleChange);
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
    };
  }, []);

  return [searchParams];
}
