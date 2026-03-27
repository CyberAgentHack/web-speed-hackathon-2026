import { MouseEvent, useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  alt: string;
  imageId: string;
  loading?: "eager" | "lazy";
  /** 投稿内の画像枚数（sizes 属性の最適化に使う） */
  imageCount?: number;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt, imageId, imageCount = 1, loading = "lazy" }: Props) => {
  // 単一画像: 最大 ~496px, 複数画像: 最大 ~246px (2列グリッド)
  const sizes =
    imageCount === 1
      ? "(max-width: 640px) calc(100vw - 80px), 496px"
      : "(max-width: 640px) calc((100vw - 84px) / 2), 246px";
  const dialogId = useId();
  const [loaded, setLoaded] = useState(false);
  const [fetchedAlt, setFetchedAlt] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog == null) return;
    const handleToggle = () => {
      if (dialog.open && fetchedAlt === null) {
        fetch(`/api/v1/images/${imageId}/alt`)
          .then((res) => res.json())
          .then((data: { alt: string }) => setFetchedAlt(data.alt))
          .catch(() => setFetchedAlt(""));
      }
    };
    dialog.addEventListener("toggle", handleToggle);
    return () => dialog.removeEventListener("toggle", handleToggle);
  }, [imageId, fetchedAlt]);

  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!loaded && <div className="bg-cax-surface-subtle absolute inset-0 animate-pulse" />}
      <img
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        loading={loading}
        {...(loading === "eager" ? { fetchPriority: "high" as const } : {})}
        sizes={sizes}
        src={getImagePath(imageId, 640)}
        srcSet={`${getImagePath(imageId, 320)} 320w, ${getImagePath(imageId, 640)} 640w, ${getImagePath(imageId, 960)} 960w`}
        onLoad={() => setLoaded(true)}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} ref={dialogRef} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{fetchedAlt !== null ? fetchedAlt : "読み込み中..."}</p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
