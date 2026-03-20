import type { SSRData } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

let ssrData: SSRData | null =
  typeof window !== "undefined"
    ? (((window as any).__SSR_DATA__ as SSRData | undefined) ?? null)
    : null;

/** SSR 時にサーバー側からデータを注入する */
export function setSSRData(data: SSRData): void {
  ssrData = data;
}

/** SSR データを取得する */
export function getSSRData(): SSRData | null {
  return ssrData;
}

/** SSR データをクリアする。render 完了後に呼ぶ。 */
export function clearSSRData(): void {
  ssrData = null;
  if (typeof window !== "undefined") {
    delete (window as any).__SSR_DATA__;
  }
}
