import { useEffect, useState } from "react";

export const useFetch = (url: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false; //  アンマウント対策

    const fetchData = async () => {
      const res = await fetch(url);
      const json = await res.json();

      if (!ignore) {
        setData(json);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [url]); //  urlだけ依存

  return { data, loading };
};
