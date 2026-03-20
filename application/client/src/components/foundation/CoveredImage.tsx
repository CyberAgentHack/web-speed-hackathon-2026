import classNames from "classnames";
import { load, ImageIFD } from "piexifjs";
import { MouseEvent, RefCallback, useCallback, useId, useMemo, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

function getImageSize(data: ArrayBuffer): { width: number; height: number } {
  const view = new DataView(data);
  const uint8 = new Uint8Array(data);

  // JPEG: find SOF0-SOF3 marker
  if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
    let offset = 2;
    while (offset < uint8.length - 1) {
      if (uint8[offset] !== 0xFF) break;
      const marker = uint8[offset + 1]!;
      if (marker >= 0xC0 && marker <= 0xC3) {
        const height = view.getUint16(offset + 5);
        const width = view.getUint16(offset + 7);
        return { width, height };
      }
      const segmentLength = view.getUint16(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  // PNG
  if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return { width, height };
  }

  // GIF
  if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) {
    const width = view.getUint16(6, true);
    const height = view.getUint16(8, true);
    return { width, height };
  }

  // WebP
  if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46 &&
      uint8[8] === 0x57 && uint8[9] === 0x45 && uint8[10] === 0x42 && uint8[11] === 0x50) {
    // Find VP8 chunk
    let offset = 12;
    while (offset < uint8.length - 8) {
      const chunkId = String.fromCharCode(uint8[offset]!, uint8[offset + 1]!, uint8[offset + 2]!, uint8[offset + 3]!);
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === "VP8 ") {
        const width = view.getUint16(offset + 14, true) & 0x3FFF;
        const height = view.getUint16(offset + 16, true) & 0x3FFF;
        return { width, height };
      }
      if (chunkId === "VP8L") {
        const bits = view.getUint32(offset + 9, true);
        const width = (bits & 0x3FFF) + 1;
        const height = ((bits >> 14) & 0x3FFF) + 1;
        return { width, height };
      }
      if (chunkId === "VP8X") {
        const width = ((uint8[offset + 12]!) | (uint8[offset + 13]! << 8) | (uint8[offset + 14]! << 16)) + 1;
        const height = ((uint8[offset + 15]!) | (uint8[offset + 16]! << 8) | (uint8[offset + 17]! << 16)) + 1;
        return { width, height };
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }
  }

  return { width: 0, height: 0 };
}

interface Props {
  src: string;
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
    return data != null ? getImageSize(data) : { height: 0, width: 0 };
  }, [data]);

  const alt = useMemo(() => {
    const binaryStr = data != null ? Array.from(new Uint8Array(data)).map(b => String.fromCharCode(b)).join("") : null;
    const exif = binaryStr != null ? load(binaryStr) : null;
    const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
    return raw != null ? new TextDecoder().decode(Uint8Array.from(raw.split("").map((c: string) => c.charCodeAt(0)))) : "";
  }, [data]);

  const blobUrl = useMemo(() => {
    return data != null ? URL.createObjectURL(new Blob([data])) : null;
  }, [data]);

  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    setContainerSize({
      height: el?.clientHeight ?? 0,
      width: el?.clientWidth ?? 0,
    });
  }, []);

  if (isLoading || data === null || blobUrl === null) {
    return null;
  }

  const containerRatio = containerSize.height / containerSize.width;
  const imageRatio = imageSize?.height / imageSize?.width;

  return (
    <div ref={callbackRef} className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": containerRatio > imageRatio,
            "w-full h-auto": containerRatio <= imageRatio,
          },
        )}
        src={blobUrl}
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
