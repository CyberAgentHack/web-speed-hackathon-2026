import { useEffect, useState, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);

  // Monkey-patch pushState/replaceState to detect SPA navigation
  const origPushState = history.pushState.bind(history);
  const origReplaceState = history.replaceState.bind(history);
  history.pushState = (...args) => {
    origPushState(...args);
    callback();
  };
  history.replaceState = (...args) => {
    origReplaceState(...args);
    callback();
  };

  return () => {
    window.removeEventListener("popstate", callback);
    history.pushState = origPushState;
    history.replaceState = origReplaceState;
  };
}

function getSnapshot() {
  return window.location.search;
}

export function useSearchParams(): [URLSearchParams] {
  const search = useSyncExternalStore(subscribe, getSnapshot);
  return [new URLSearchParams(search)];
}
