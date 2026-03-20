import { useEffect, useState, useSyncExternalStore } from "react";

export function useSearchParams(): [URLSearchParams] {
  const search = useSyncExternalStore(
    (callback) => {
      window.addEventListener("popstate", callback);
      return () => window.removeEventListener("popstate", callback);
    },
    () => window.location.search,
  );

  return [new URLSearchParams(search)];
}
