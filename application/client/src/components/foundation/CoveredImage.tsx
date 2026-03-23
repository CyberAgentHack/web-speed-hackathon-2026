import classNames from "classnames";
import { MouseEvent, RefCallback, useCallback, useId, useState, useRef } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  image: Models.Image;
  isPriority?: boolean;
}

export const CoveredImage = ({ image, isPriority }: Props) => {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const src = getImagePath(image.id);

  const handleShowModal = useCallback(() => {
    const el = document.getElementById(dialogId) as HTMLDialogElement;
    el?.showModal();
  }, [dialogId]);

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const imageSize = { height: image.height || 0, width: image.width || 0 };
  const alt = image.alt || "説明はありません";

  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    if (el) {
      setContainerSize({
        height: el.clientHeight,
        width: el.clientWidth,
      });
    }
  }, []);

  const containerRatio = containerSize.width ? containerSize.height / containerSize.width : 0;
  const imageRatio = imageSize.width ? imageSize.height / imageSize.width : 0;

  return (
    <div ref={callbackRef} className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": containerRatio > imageRatio,
            "w-full h-auto": containerRatio <= imageRatio,
          },
        )}
        src={src}
        fetchPriority={isPriority ? "high" : "auto"}
        loading={isPriority ? "eager" : "lazy"}
        decoding="async"
        width={image.width}
        height={image.height}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        onClick={handleShowModal}
      >
        ALT を表示する
      </button>

      <Modal ref={dialogRef} id={dialogId} closedby="any" onClick={handleDialogClick}>
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
