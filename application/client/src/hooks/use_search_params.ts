import { useSearchParams as useRouterSearchParams } from "react-router";

export function useSearchParams(): [URLSearchParams] {
  const [searchParams] = useRouterSearchParams();
  return [searchParams];
}
