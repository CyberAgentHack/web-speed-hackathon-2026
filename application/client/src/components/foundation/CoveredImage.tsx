import { MouseEvent, useCallback, useId } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  src: string;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src }: Props) => {
  const modalId = useId();

  const handleContainerClick = useCallback((ev: MouseEvent<HTMLButtonElement>) => {
    ev.stopPropagation();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt=""
        className="absolute left-1/2 top-1/2 h-full w-full max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
        src={src}
        loading="lazy"
        decoding="async"
      />
      <button
        aria-label="画像を表示"
        className="absolute inset-0 block h-full w-full cursor-zoom-in opacity-0"
        command="show-modal"
        commandfor={modalId}
        onClick={handleContainerClick}
        type="button"
      />
      <Modal className="max-w-screen-md! w-fit" id={modalId}>
        <div className="flex flex-col gap-4 p-4 sm:p-6 sm:pb-4">
          <img alt="" className="mx-auto block" src={src} />
          <div className="flex shrink-0 grow-0 justify-end">
            <Button command="close" commandfor={modalId} styleType="secondary">
              閉じる
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
