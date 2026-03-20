import { MouseEvent, useCallback, useId } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  alt: string;
  src: string;
  priority?: boolean;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt, src, priority }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const showModalRef = useCallback(
    (el: HTMLButtonElement | null) => {
      if (el) {
        el.setAttribute("command", "show-modal");
        el.setAttribute("commandfor", dialogId);
      }
    },
    [dialogId],
  );
  const closeRef = useCallback(
    (el: HTMLButtonElement | null) => {
      if (el) {
        el.setAttribute("command", "close");
        el.setAttribute("commandfor", dialogId);
      }
    },
    [dialogId],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="h-full w-full object-cover"
        decoding="async"
        {...(priority
          ? { fetchPriority: "high" as const, loading: "eager" as const }
          : { loading: "lazy" as const })}
        src={src}
        style={{ imageOrientation: "from-image" }}
      />

      <button
        ref={showModalRef}
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{alt}</p>

          <Button ref={closeRef} variant="secondary">
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
