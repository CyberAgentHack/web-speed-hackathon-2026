import { SWRConfiguration } from "swr";

export const swrFetcher = (url: string) => fetch(url).then((res) => res.json());

const PAGE_SIZE = 30;

/**
 * useSWRInfinite 用の getKey ファクトリ。
 * ページごとに limit/offset を付与した URL を返す。
 * 前ページの結果が PAGE_SIZE 未満なら null を返して打ち止め。
 */
export function createInfiniteKey(basePath: string) {
  return (pageIndex: number, previousPageData: unknown[] | null) => {
    if (previousPageData !== null && previousPageData.length < PAGE_SIZE) return null;

    const separator = basePath.includes("?") ? "&" : "?";
    return `${basePath}${separator}limit=${PAGE_SIZE}&offset=${pageIndex * PAGE_SIZE}`;
  };
}

export const swrConfig: SWRConfiguration = {
  fetcher: swrFetcher,
  revalidateOnFocus: false,
  dedupingInterval: 5000,
};
