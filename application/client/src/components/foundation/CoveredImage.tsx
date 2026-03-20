import { load, ImageIFD } from "piexifjs";
import { MouseEvent, useCallback, useEffect, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

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

  // EXIF alt text is loaded lazily after first paint — does not block rendering
  const [alt, setAlt] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((data) => {
        if (cancelled) return;
        try {
          const exif = load(Buffer.from(data).toString("binary"));
          const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
          if (raw != null) {
            setAlt(new TextDecoder().decode(Buffer.from(raw, "binary")));
          }
        } catch {
          // ignore EXIF parse errors
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Render immediately with native img — no binary fetch required before paint */}
      <img alt={alt} className="absolute inset-0 h-full w-full object-cover" src={src} />

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
