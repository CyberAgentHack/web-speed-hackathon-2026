import { fetchBinary } from "./fetchers";

const cache = new Map<string, Promise<ArrayBuffer>>();

export function fetchBinaryCached(url: string): Promise<ArrayBuffer> {
  if (!cache.has(url)) {
    cache.set(url, fetchBinary(url));
  }
  return cache.get(url)!;
}
