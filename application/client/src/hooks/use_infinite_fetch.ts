import { useEffect, useState, useRef } from "react";

export const useInfiniteFetch = (url: string) => {
  const [data, setData] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadingRef = useRef(false); //  重複リクエスト防止

  const fetchMore = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    const res = await fetch(`${url}?offset=${offset}&limit=20`);
    const json = await res.json();

    setData((prev) => [...prev, ...json]);
    setOffset((prev) => prev + 20);

    setLoading(false);
    loadingRef.current = false;
  };

  useEffect(() => {
    fetchMore();
  }, []); //  依存配列を空にする（超重要）

  return { data, fetchMore, loading };
};
