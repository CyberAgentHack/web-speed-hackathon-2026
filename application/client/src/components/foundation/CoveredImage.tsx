import { MouseEvent, useCallback, useEffect, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  alt?: string;
  src: string;
  metadataSrc?: string;
  fetchPriority?: "auto" | "high";
  loading?: "eager" | "lazy";
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({
  alt: initialAlt = "",
  fetchPriority = "auto",
  src,
  metadataSrc,
  loading = "lazy",
}: Props) => {
  const dialogId = useId();
  const [isAltRequested, setIsAltRequested] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(src);
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  // EXIF alt text is loaded lazily after first paint — does not block rendering
  const [alt, setAlt] = useState(initialAlt);
  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  useEffect(() => {
    if (!isAltRequested || alt !== "") {
      return;
    }

    let cancelled = false;
    const parseAlt = async () => {
      try {
        const [{ ImageIFD, load }, response] = await Promise.all([
          import("piexifjs"),
          fetch(metadataSrc ?? src),
        ]);
        const data = await response.arrayBuffer();
        if (cancelled) {
          return;
        }

        const binary = Array.from(new Uint8Array(data), (byte) => String.fromCharCode(byte)).join(
          "",
        );
        const exif = load(binary);
        const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
        if (raw != null) {
          const description = typeof raw === "string" ? raw : String(raw);
          setAlt(
            new TextDecoder().decode(Uint8Array.from(description, (char) => char.charCodeAt(0))),
          );
        }
      } catch {
        // ignore EXIF parse errors
      }
    };

    void parseAlt();

    return () => {
      cancelled = true;
    };
  }, [alt, isAltRequested, metadataSrc, src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Render immediately with native img — no binary fetch required before paint */}
      <img
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        fetchPriority={fetchPriority}
        loading={loading}
        onError={() => {
          if (metadataSrc != null && displaySrc !== metadataSrc) {
            setDisplaySrc(metadataSrc);
          }
        }}
        src={displaySrc}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
        onClick={() => setIsAltRequested(true)}
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
