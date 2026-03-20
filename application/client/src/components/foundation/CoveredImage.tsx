import { MouseEvent, useCallback, useRef, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  alt: string;
  priority?: boolean;
  src: string;
  srcSet?: string;
  sizes?: string;
}

const sanitizeAltText = (value: string): string => {
  // DOM 属性に設定できない制御文字を除去する
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
};

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, srcSet, sizes, alt, priority = false }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const [resolvedAlt, setResolvedAlt] = useState(sanitizeAltText(alt));
  const [isLoadingAlt, setIsLoadingAlt] = useState(false);
  const [isPriorityImageReady, setIsPriorityImageReady] = useState(!priority);

  const handleOpenDialog = useCallback((ev: MouseEvent<HTMLButtonElement>) => {
    ev.stopPropagation();
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  const handleCloseDialog = useCallback((ev: MouseEvent<HTMLButtonElement>) => {
    ev.stopPropagation();
    dialogRef.current?.close();
  }, []);

  const handleLoadAlt = useCallback(() => {
    if (resolvedAlt !== "" || isLoadingAlt || src.trim() === "") {
      return;
    }

    setIsLoadingAlt(true);
    void fetchBinary(src)
      .then(async (data) => {
        const { load, ImageIFD } = await import("piexifjs");
        const binary = Array.from(new Uint8Array(data))
          .map((byte) => String.fromCharCode(byte))
          .join("");
        const exif = load(binary);
        const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
        if (typeof raw !== "string") {
          return;
        }
        const decoded = new TextDecoder().decode(
          Uint8Array.from(raw, (char) => char.charCodeAt(0)),
        );
        setResolvedAlt(sanitizeAltText(decoded));
      })
      .catch(() => undefined)
      .finally(() => {
        setIsLoadingAlt(false);
      });
  }, [isLoadingAlt, resolvedAlt, src]);

  const handleShowAltClick = useCallback(
    (ev: MouseEvent<HTMLButtonElement>) => {
      handleOpenDialog(ev);
      handleLoadAlt();
    },
    [handleLoadAlt, handleOpenDialog],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={resolvedAlt}
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        onError={() => setIsPriorityImageReady(true)}
        onLoad={() => setIsPriorityImageReady(true)}
        sizes={sizes}
        src={src}
        srcSet={srcSet}
        style={priority && !isPriorityImageReady ? { visibility: "hidden" } : undefined}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        onClick={handleShowAltClick}
        type="button"
      >
        ALT を表示する
      </button>

      <Modal closedby="any" onClick={handleDialogClick} ref={dialogRef}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{isLoadingAlt ? "読み込み中..." : resolvedAlt}</p>

          <Button onClick={handleCloseDialog} variant="secondary">
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
