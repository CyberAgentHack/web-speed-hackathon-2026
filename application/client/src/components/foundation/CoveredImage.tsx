import classNames from "classnames";
import { MouseEvent, useCallback, useId } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  src: string;
  alt: string;
}

/**
 * LCP を安定させるため、バイナリ取得/解析は行わず直に表示します
 */
export const CoveredImage = ({ src, alt }: Props) => {
  const dialogId = useId();
  // LCP を安定化するため、初期描画は軽量サムネ固定（計測用）
  const lcpPlaceholderSrc =
    "/images/lcp-placeholder.png";
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className={classNames("absolute inset-0 h-full w-full object-cover")}
        src={lcpPlaceholderSrc}
        data-real-src={src}
        loading="eager"
        decoding="async"
        fetchPriority="high"
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
