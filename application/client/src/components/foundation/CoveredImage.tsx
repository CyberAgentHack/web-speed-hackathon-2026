import { load, ImageIFD } from "piexifjs";
import { MouseEvent, useCallback, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

function extractAltFromBinary(data: ArrayBuffer): string {
  try {
    const binary = Buffer.from(data).toString("binary");
    const exif = load(binary);
    const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
    return raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "";
  } catch {
    return "";
  }
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src }: Props) => {
  const dialogId = useId();
  const [alt, setAlt] = useState<string | null>(null);

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  // ALTボタンクリック時にのみEXIFを読み取る（初期描画を高速化）
  const handleAltClick = useCallback(() => {
    if (alt !== null) return; // 既に読み込み済み
    fetchBinary(src).then((data) => {
      setAlt(extractAltFromBinary(data));
    }).catch(() => {
      setAlt("");
    });
  }, [src, alt]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt ?? ""}
        className="h-full w-full object-cover"
        loading="lazy"
        src={src}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
        onClick={handleAltClick}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>
          <p className="text-sm">{alt ?? "読み込み中..."}</p>
          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
