import { useEffect, useState, useRef } from "react";

export const useInfiniteFetch = (path: string) => {
  const [data, setData] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadingRef = useRef(false);

  const fetchMore = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      // （相対パス）
      const res = await fetch(`${path}?offset=${offset}&limit=20`);

      if (!res.ok) {
        console.error("Fetch error:", res.status);
        return;
      }

      const json = await res.json();

      setData((prev) => [...prev, ...json]);
      setOffset((prev) => prev + 20);
    } catch (e) {
      console.error("Fetch failed:", e);
    }

    setLoading(false);
    loadingRef.current = false;
  };

  useEffect(() => {
    fetchMore();
  }, []); //  無限ループ防止

  return { data, fetchMore, loading };
};
