import { useMemo, useSyncExternalStore } from "react";

const URL_CHANGE_EVENT = "cax:urlchange";
let isHistoryPatched = false;

const getSearchSnapshot = () => window.location.search;

const notifyUrlChange = () => {
  window.dispatchEvent(new Event(URL_CHANGE_EVENT));
};

const patchHistory = () => {
  if (isHistoryPatched) {
    return;
  }

  isHistoryPatched = true;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = ((data, unused, url) => {
    originalPushState(data, unused, url);
    notifyUrlChange();
  }) as History["pushState"];

  window.history.replaceState = ((data, unused, url) => {
    originalReplaceState(data, unused, url);
    notifyUrlChange();
  }) as History["replaceState"];
};

const subscribe = (onStoreChange: () => void) => {
  patchHistory();

  window.addEventListener(URL_CHANGE_EVENT, onStoreChange);
  window.addEventListener("popstate", onStoreChange);

  return () => {
    window.removeEventListener(URL_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
};

export function useSearchParams(): [URLSearchParams] {
  const search = useSyncExternalStore(subscribe, getSearchSnapshot, getSearchSnapshot);
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  return [searchParams];
}
