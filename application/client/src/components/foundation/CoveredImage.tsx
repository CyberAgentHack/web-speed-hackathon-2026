import { MouseEvent, useCallback, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  alt: string;
  src: string;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, alt }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const [resolvedAlt, setResolvedAlt] = useState(alt);
  const [isLoadingAlt, setIsLoadingAlt] = useState(false);
  const handleLoadAlt = useCallback(() => {
    if (resolvedAlt !== "" || isLoadingAlt) {
      return;
    }

    setIsLoadingAlt(true);
    void fetchBinary(src)
      .then(async (data) => {
        const { load, ImageIFD } = await import("piexifjs");
        const binary = Array.from(new Uint8Array(data))
          .map((byte) => String.fromCharCode(byte))
          .join("");
        const exif = load(binary);
        const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
        if (typeof raw !== "string") {
          return;
        }
        const decoded = new TextDecoder().decode(
          Uint8Array.from(raw, (char) => char.charCodeAt(0)),
        );
        setResolvedAlt(decoded);
      })
      .catch(() => undefined)
      .finally(() => {
        setIsLoadingAlt(false);
      });
  }, [isLoadingAlt, resolvedAlt, src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={resolvedAlt}
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        loading="lazy"
        src={src}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        onClick={handleLoadAlt}
        type="button"
        command="show-modal"
        commandfor={dialogId}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{isLoadingAlt ? "読み込み中..." : resolvedAlt}</p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
