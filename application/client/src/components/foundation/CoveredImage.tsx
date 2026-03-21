import classNames from "classnames";
import sizeOf from "image-size";
import { load, ImageIFD } from "piexifjs";
import { MouseEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let result = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }

  return result;
}

function latin1StringToUint8Array(value: string): Uint8Array {
  return Uint8Array.from(value, (char) => char.charCodeAt(0));
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const { data, isLoading } = useFetch(src, fetchBinary);

  const imageSize = useMemo(() => {
    return data != null ? sizeOf(new Uint8Array(data)) : { height: 0, width: 0 };
  }, [data]);

  const alt = useMemo(() => {
    const exif = data != null ? load(arrayBufferToBinaryString(data)) : null;
    const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
    return typeof raw === "string" ? new TextDecoder().decode(latin1StringToUint8Array(raw)) : "";
  }, [data]);

  const blobUrl = useMemo(() => {
    return data != null ? URL.createObjectURL(new Blob([data])) : null;
  }, [data]);

  useEffect(() => {
    if (blobUrl == null) {
      return;
    }

    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el == null) {
      return;
    }

    const updateContainerSize = () => {
      setContainerSize({
        height: el.clientHeight,
        width: el.clientWidth,
      });
    };

    updateContainerSize();

    const observer = new ResizeObserver(updateContainerSize);
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const hasImage = !isLoading && data !== null && blobUrl !== null;
  const hasValidSize = containerSize.height > 0 && containerSize.width > 0;
  const hasValidImageSize = imageSize.height > 0 && imageSize.width > 0;
  const canCalculateRatio = hasValidSize && hasValidImageSize;

  const containerRatio = containerSize.height / containerSize.width;
  const imageRatio = imageSize?.height / imageSize?.width;

  return (
    <div
      ref={containerRef}
      className={classNames("relative h-full w-full overflow-hidden bg-cax-surface-subtle", {
        "animate-pulse": !hasImage,
      })}
    >
      <img
        alt={alt}
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "h-full w-auto": hasImage && canCalculateRatio && containerRatio > imageRatio,
            "h-auto w-full": hasImage && canCalculateRatio && containerRatio <= imageRatio,
            "h-full w-full": !hasImage || !canCalculateRatio,
          },
        )}
        src={hasImage ? blobUrl : undefined}
        loading="lazy"
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        command="show-modal"
        commandfor={dialogId}
        disabled={!hasImage}
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
