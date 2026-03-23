import { useSyncExternalStore } from "react";

let listeners: (() => void)[] = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot() {
  return window.location.search;
}

const origPushState = history.pushState.bind(history);
const origReplaceState = history.replaceState.bind(history);
history.pushState = (...args) => {
  origPushState(...args);
  for (const l of listeners) l();
};
history.replaceState = (...args) => {
  origReplaceState(...args);
  for (const l of listeners) l();
};
window.addEventListener("popstate", () => {
  for (const l of listeners) l();
});

export function useSearchParams(): [URLSearchParams] {
  const search = useSyncExternalStore(subscribe, getSnapshot);
  return [new URLSearchParams(search)];
}
