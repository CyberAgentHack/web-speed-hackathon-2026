import classNames from "classnames";
import { load, ImageIFD } from "piexifjs";
import { MouseEvent, RefCallback, useCallback, useEffect, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
  width: number;
  height: number;
  fetchPriority?: "high" | "low" | "auto";
}

function isJpeg(data: ArrayBuffer): boolean {
  const bytes = new Uint8Array(data);
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, width, height, fetchPriority = "auto" }: Props) => {
  const dialogId = useId();
  const [alt, setAlt] = useState("");
  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });

  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  // EXIF 解析を非同期でバックグラウンド実施
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchBinary(src);
        if (isJpeg(data)) {
          const exif = load(Buffer.from(data).toString("binary"));
          const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
          if (raw != null) {
            setAlt(new TextDecoder().decode(Buffer.from(raw, "binary")));
          }
        }
      } catch {
        // Ignore EXIF parsing errors
      }
    })();
  }, [src]);

  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    setContainerSize({
      height: el?.clientHeight ?? 0,
      width: el?.clientWidth ?? 0,
    });
  }, []);

  const containerRatio = containerSize.height / containerSize.width;
  const imageRatio = height / width;

  return (
    <div ref={callbackRef} className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        fetchPriority={fetchPriority}
        height={height}
        width={width}
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": containerRatio > imageRatio,
            "w-full h-auto": containerRatio <= imageRatio,
          },
        )}
        src={src}
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
