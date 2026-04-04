import classNames from "classnames";
import { MouseEvent, useCallback, useId } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { showDialog } from "@web-speed-hackathon-2026/client/src/utils/dialog";

interface Props {
  src: string;
  alt: string;
  /** 複数枚あるときは 1 枚だけ true（LCP・帯域の競合を避ける） */
  isLcpCandidate?: boolean;
}

/**
 * LCP を安定させるため、バイナリ取得/解析は行わず直に表示します
 */
export const CoveredImage = ({ src, alt, isLcpCandidate = true }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className={classNames("absolute inset-0 h-full w-full object-cover")}
        src={src}
        decoding="async"
        fetchPriority={isLcpCandidate ? "high" : "low"}
        loading={isLcpCandidate ? "eager" : "lazy"}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        command="show-modal"
        commandfor={dialogId}
        onClick={() => showDialog(dialogId)}
        type="button"
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
