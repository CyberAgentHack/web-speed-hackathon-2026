import { MouseEvent, useCallback, useEffect, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const [alt, setAlt] = useState("");

  // ALT テキストを EXIF から非同期で取得
  useEffect(() => {
    let cancelled = false;
    fetchBinary(src).then(async (data) => {
      if (cancelled) return;
      try {
        const { load, ImageIFD } = await import("piexifjs");
        const arr = new Uint8Array(data);
        let binary = "";
        for (let i = 0; i < arr.length; i++) {
          binary += String.fromCharCode(arr[i]!);
        }
        const exif = load(binary);
        const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
        if (raw != null) {
          const decoded = new TextDecoder().decode(
            Uint8Array.from(raw as string, (c: string) => c.charCodeAt(0)),
          );
          if (!cancelled) setAlt(decoded);
        }
      } catch {
        // EXIF 読み取り失敗は無視
      }
    });
    return () => { cancelled = true; };
  }, [src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="h-full w-full object-cover"
        src={src}
        loading="lazy"
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{alt}</p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
