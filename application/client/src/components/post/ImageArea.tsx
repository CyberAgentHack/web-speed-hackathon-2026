import classNames from "classnames";
import { MouseEvent, useCallback, useId, useState } from "react";

import { SimpleImage } from "@web-speed-hackathon-2026/client/src/components/foundation/SimpleImage";
import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
  priority?: boolean;
}

export const ImageArea = ({ images, priority = false }: Props) => {
  const [selectedImage, setSelectedImage] = useState<Models.Image | null>(null);
  const dialogId = useId();

  const handleImageClick = useCallback((image: Models.Image, ev: MouseEvent) => {
    ev.stopPropagation();
    setSelectedImage(image);
  }, []);

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  return (
    <>
      <div className="w-full" style={{ aspectRatio: "16 / 9" }}>
        <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
          {images.map((image, idx) => {
            // 最初の画像だけ最高優先度（LCP対策）
            const isPrimaryImage = idx === 0 && priority;
            return (
              <div
                key={image.id}
                className={classNames("bg-cax-surface-subtle relative overflow-hidden", {
                  "col-span-1": images.length !== 1,
                  "col-span-2": images.length === 1,
                  "row-span-1": images.length > 2 && (images.length !== 3 || idx !== 0),
                  "row-span-2": images.length <= 2 || (images.length === 3 && idx === 0),
                })}
              >
                <SimpleImage
                  src={getImagePath(image.id)}
                  alt={image.alt ?? ""}
                  priority={isPrimaryImage}
                  width={800}
                  height={450}
                />
                <button
                  className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
                  type="button"
                  command="show-modal"
                  commandfor={dialogId}
                  onClick={(ev) => handleImageClick(image, ev)}
                >
                  ALT を表示する
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>
          <p className="text-sm">{selectedImage?.alt ?? ""}</p>
          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </>
  );
};
