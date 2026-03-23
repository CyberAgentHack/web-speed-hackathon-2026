import { useMemo } from "react";
import { useLocation } from "react-router";

export function useSearchParams(): [URLSearchParams] {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  return [searchParams];
}
