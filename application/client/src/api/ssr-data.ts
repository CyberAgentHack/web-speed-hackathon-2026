import type { SSRData } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

/**
 * SSR データを初回レンダリングで消費するためのヘルパー。
 *
 * モジュール初期化時に window.__SSR_DATA__ をキャプチャし、
 * 各コンポーネントは初回レンダーで一度だけ読み取る。
 * clearSSRData() でキャプチャ済みデータをクリアする（クライアントナビゲーション対策）。
 */
let ssrData: SSRData | null =
  typeof window !== "undefined"
    ? (((window as any).__SSR_DATA__ as SSRData | undefined) ?? null)
    : null;

/** SSR データを取得する（clearSSRData() 呼び出し前まで有効） */
export function getSSRData(): SSRData | null {
  return ssrData;
}

/** SSR データをクリアする。hydration 完了後に呼ぶ。 */
export function clearSSRData(): void {
  ssrData = null;
  if (typeof window !== "undefined") {
    delete (window as any).__SSR_DATA__;
  }
}
