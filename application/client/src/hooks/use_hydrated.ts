import { useEffect, useState } from "react";

let hydrated = false;

export function useHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(hydrated);

  useEffect(() => {
    hydrated = true;
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
