import { load, ImageIFD } from "piexifjs";
import { MouseEvent, useCallback, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
  priority?: boolean;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, priority }: Props) => {
  const dialogId = useId();
  const [alt, setAlt] = useState("");
  const [isLoadingAlt, setIsLoadingAlt] = useState(false);

  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const handleOpenAlt = useCallback(async () => {
    if (isLoadingAlt || alt !== "") {
      return;
    }

    setIsLoadingAlt(true);
    try {
      const data = await fetchBinary(src);
      const exif = load(Buffer.from(data).toString("binary"));
      const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
      setAlt(raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "");
    } catch {
      setAlt("");
    } finally {
      setIsLoadingAlt(false);
    }
  }, [alt, isLoadingAlt, src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="h-full w-full object-cover"
        src={src}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
        onClick={() => {
          void handleOpenAlt();
        }}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">
            {isLoadingAlt ? "読み込み中..." : alt || "説明はありません"}
          </p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
