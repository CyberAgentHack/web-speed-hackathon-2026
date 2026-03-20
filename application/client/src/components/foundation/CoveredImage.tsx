import { MouseEvent, useCallback, useId, useRef, useState } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [alt, setAlt] = useState("");

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const handleAltButtonClick = useCallback(async () => {
    // Load EXIF alt text on demand
    if (!alt) {
      try {
        const data = await fetchBinary(src);
        const { load, ImageIFD } = await import("piexifjs");
        const exif = load(Buffer.from(data).toString("binary"));
        const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
        if (raw != null) {
          setAlt(new TextDecoder().decode(Buffer.from(raw, "binary")));
        }
      } catch {
        // ignore EXIF errors
      }
    }
    dialogRef.current?.showModal();
  }, [src, alt]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        onClick={handleAltButtonClick}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" ref={dialogRef} onClick={handleDialogClick}>
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
