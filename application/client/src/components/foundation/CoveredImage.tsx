import classNames from "classnames";
import { MouseEvent, RefCallback, useCallback, useEffect, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import {
  RESPONSIVE_IMAGE_WIDTHS,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  src: string;
  width: number;
  height: number;
  alt?: string;
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({
  src,
  width,
  height,
  alt = "",
  fetchPriority = "auto",
  sizes,
}: Props) => {
  const dialogId = useId();
  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const imgRef = useCallback<RefCallback<HTMLImageElement>>((el) => {
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, []);
  const srcSet = width > 0 ? [
    ...RESPONSIVE_IMAGE_WIDTHS.filter((candidateWidth) => candidateWidth < width).map(
      (candidateWidth) =>
        `${src.replace(/\.webp$/, `-${candidateWidth}w.webp`)} ${candidateWidth}w`,
    ),
    `${src} ${width}w`,
  ].join(", ") : "";

  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    setContainerSize({
      height: el?.clientHeight ?? 0,
      width: el?.clientWidth ?? 0,
    });
  }, []);

  const containerRatio = containerSize.width > 0 ? containerSize.height / containerSize.width : 1;
  const imageRatio = width > 0 && height > 0 ? height / width : 1;

  return (
    <div ref={callbackRef} className="relative h-full w-full overflow-hidden">
      <img
        ref={imgRef}
        alt={alt}
        fetchPriority={fetchPriority}
        height={height}
        loading="eager"
        width={width}
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": containerRatio > imageRatio,
            "w-full h-auto": containerRatio <= imageRatio,
          },
        )}
        sizes={sizes}
        src={src}
        srcSet={srcSet}
        onLoad={() => {
          setIsLoaded(true);
        }}
        onError={() => {
          setIsLoaded(false);
        }}
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
