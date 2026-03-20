import { MouseEvent, useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  alt: string;
  src: string;
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt: initialAlt, src, fetchPriority }: Props) => {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [alt, setAlt] = useState(initialAlt);

  useEffect(() => {
    setAlt(initialAlt);
  }, [initialAlt]);

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const handleAltButtonClick = useCallback(async () => {
    if (!alt) {
      try {
        const data = await fetchBinary(src);
        const { load, ImageIFD } = await import("piexifjs");
        const bytes = new Uint8Array(data as ArrayBuffer);
        const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
        const exif = load(binary);
        const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
        if (raw != null) {
          const rawBytes = Uint8Array.from(raw as string, (c) => c.charCodeAt(0));
          setAlt(new TextDecoder().decode(rawBytes));
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
        fetchPriority={fetchPriority}
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
