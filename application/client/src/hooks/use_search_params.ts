import { useSearchParams as useRRSearchParams } from "react-router";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams] = useRRSearchParams();
  return [searchParams];
}
