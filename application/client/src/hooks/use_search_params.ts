import { useMemo } from "react";
import { useSearch } from "wouter";

export function useSearchParams(): [URLSearchParams] {
  const search = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  return [searchParams];
}
