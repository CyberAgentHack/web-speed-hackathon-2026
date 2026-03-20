import { MouseEvent, useCallback, useId } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  alt?: string;
  src: string;
  priority?: boolean;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt = "", src, priority = false }: Props) => {
  const dialogId = useId();
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  // Build WebP srcset paths from the JPEG src
  // e.g. "/images/{uuid}.jpg" -> "/images/{uuid}-400.webp 400w, /images/{uuid}-800.webp 800w"
  const webpSrcset = src.endsWith(".jpg")
    ? `${src.replace(/\.jpg$/, "-400.webp")} 400w, ${src.replace(/\.jpg$/, "-800.webp")} 800w`
    : undefined;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <picture>
        {webpSrcset != null && (
          <source srcSet={webpSrcset} type="image/webp" />
        )}
        <img
          alt={alt}
          className="h-full w-full object-cover"
          src={src}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>

      {alt !== "" && (
        <>
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
        </>
      )}
    </div>
  );
};
