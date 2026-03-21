import { MouseEvent, useCallback, useState } from "react";

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
  const [showAltModal, setShowAltModal] = useState(false);

  const handleDialogMount = useCallback((el: HTMLDialogElement | null) => {
    if (el) el.showModal();
  }, []);

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const handleClose = useCallback(() => {
    setShowAltModal(false);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="h-full w-full object-cover"
        src={src}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />

      {alt !== "" && (
        <>
          <button
            className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
            type="button"
            onClick={() => setShowAltModal(true)}
          >
            ALT を表示する
          </button>

          {showAltModal && (
            <Modal ref={handleDialogMount} closedby="any" onClick={handleDialogClick} onClose={handleClose}>
              <div className="grid gap-y-6">
                <h1 className="text-center text-2xl font-bold">画像の説明</h1>

                <p className="text-sm">{alt}</p>

                <Button variant="secondary" onClick={handleClose}>
                  閉じる
                </Button>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};
