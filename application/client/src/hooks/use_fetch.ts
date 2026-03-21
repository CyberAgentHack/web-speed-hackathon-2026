import { useEffect, useState } from "react";

export const useFetch = (path: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        //  相対パスでAPIを叩く（Fly対応）
        const res = await fetch(path);

        if (!res.ok) {
          console.error("Fetch error:", res.status);
          return;
        }

        const json = await res.json();

        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      } catch (e) {
        console.error("Fetch failed:", e);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [path]);

  return { data, loading };
};
