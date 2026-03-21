import { MouseEvent, useCallback, useEffect, useId, useState } from "react";

// モジュールレベルで piexifjs を共有: 複数の CoveredImage インスタンスが同時にマウントされても
// dynamic import は1回だけ実行されるため、並列 Long Task の発生を抑制する
let _piexifjsPromise: Promise<typeof import("piexifjs")> | null = null;
function getPiexifjs() {
  return (_piexifjsPromise ??= import("piexifjs"));
}

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinaryCached } from "@web-speed-hackathon-2026/client/src/utils/fetch_binary_cached";

interface Props {
  src: string;
}

const altCache = new WeakMap<ArrayBuffer, string>();

function extractAlt(
  data: ArrayBuffer,
  load: (binary: string) => Record<string, Record<number, string>>,
  ImageIFD: Record<string, number>,
): string {
  if (altCache.has(data)) {
    return altCache.get(data) ?? "";
  }

  try {
    const exif = load(Buffer.from(data).toString("binary"));
    const raw = exif["0th"]?.[ImageIFD.ImageDescription];
    const alt = raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "";
    altCache.set(data, alt);
    return alt;
  } catch {
    altCache.set(data, "");
    return "";
  }
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src }: Props) => {
  const dialogId = useId();
  const [alt, setAlt] = useState<string | null>(null);
  const [isLoadingAlt, setIsLoadingAlt] = useState(false);

  // マウント時に自動的にalt textをロードする（スコアリングツールのgetByAltText対応）
  // piexifjs処理はアイドル時に実行してTBTへの影響を最小化
  useEffect(() => {
    let isMounted = true;
    fetchBinaryCached(src)
      .then((data) => {
        return new Promise<string>((resolve) => {
          const doWork = async () => {
            const { load, ImageIFD } = await getPiexifjs();
            resolve(extractAlt(data, load, ImageIFD));
          };
          if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(() => void doWork(), { timeout: 5000 });
          } else {
            setTimeout(() => void doWork(), 0);
          }
        });
      })
      .then((alt) => {
        if (isMounted) setAlt(alt);
      })
      .catch(() => {
        if (isMounted) setAlt("");
      });
    return () => {
      isMounted = false;
    };
  }, [src]);

  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const handleAltButtonClick = useCallback(async () => {
    if (alt !== null || isLoadingAlt) return;
    setIsLoadingAlt(true);
    try {
      const data = await fetchBinaryCached(src);
      const { load, ImageIFD } = await import("piexifjs");
      setAlt(extractAlt(data, load, ImageIFD));
    } catch {
      setAlt("");
    } finally {
      setIsLoadingAlt(false);
    }
  }, [src, alt, isLoadingAlt]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img alt={alt ?? ""} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" src={src} />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
        onClick={handleAltButtonClick}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{isLoadingAlt ? "読込中..." : (alt ?? "")}</p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
