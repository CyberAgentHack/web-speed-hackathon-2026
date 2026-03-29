import { MouseEvent, useCallback, useId } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { handleImageError } from "@web-speed-hackathon-2026/client/src/utils/error_handlers";

interface Props {
  src: string;
  isPriority?: boolean;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, isPriority = false }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const alt = "画像";

  return (
    <>
      <div className="relative h-full w-full overflow-hidden">
        <img
          alt={alt}
          className="h-full w-full object-cover"
          src={src}
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : "auto"}
          decoding={isPriority ? "sync" : "async"}
          onError={handleImageError}
        />

        <Button
          className="absolute right-1 bottom-1 px-2 py-1 text-xs"
          command="show-modal"
          commandfor={dialogId}
          variant="secondary"
        >
          ALT を表示する
        </Button>
      </div>

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
  );
};
