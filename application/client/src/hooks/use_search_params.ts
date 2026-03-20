import { useMemo } from "react";
import { useLocation } from "react-router";

export function useSearchParams(): [URLSearchParams] {
  const { search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  return [searchParams];
}
