import classNames from "classnames";
import { MouseEvent, useCallback, useId, useState } from "react";

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
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [containerRatio, setContainerRatio] = useState<number | null>(null);
  const [alt, setAlt] = useState("");

  const containerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setContainerRatio(el.clientHeight / el.clientWidth);
    }
  }, []);

  const handleLoad = useCallback((ev: React.SyntheticEvent<HTMLImageElement>) => {
    const img = ev.currentTarget;
    setImageRatio(img.naturalHeight / img.naturalWidth);
    setAlt(img.getAttribute("data-exif-alt") ?? "");
  }, []);

  const isWide = imageRatio != null && containerRatio != null && containerRatio > imageRatio;

  return (
    <div ref={containerCallbackRef} className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": isWide,
            "w-full h-auto": !isWide,
          },
        )}
        loading="lazy"
        onLoad={handleLoad}
        src={src}
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
