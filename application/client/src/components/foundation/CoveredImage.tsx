import classNames from "classnames";
import { MouseEvent, RefCallback, useCallback, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  alt: string;
  src: string;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt, src }: Props) => {
  const dialogId = useId();
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const [imageSize, setImageSize] = useState({ height: 0, width: 0 });
  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    setContainerSize({
      height: el?.clientHeight ?? 0,
      width: el?.clientWidth ?? 0,
    });
  }, []);

  const containerRatio = containerSize.height / containerSize.width;
  const imageRatio = imageSize.height / imageSize.width;

  return (
    <div ref={callbackRef} className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        loading="lazy"
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": containerRatio > imageRatio,
            "w-full h-auto": containerRatio <= imageRatio,
          },
        )}
        src={src}
        onLoad={(e) => {
          const img = e.currentTarget;
          setImageSize({ height: img.naturalHeight, width: img.naturalWidth });
        }}
      />

      {alt && (
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
