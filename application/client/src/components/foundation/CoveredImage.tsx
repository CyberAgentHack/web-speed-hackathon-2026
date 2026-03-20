import classNames from "classnames";
import sizeOf from "image-size";
import { MouseEvent, RefCallback, useCallback, useId, useMemo, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  alt?: string;
  src: string;
}

function readJpegImageDescription(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  let offset = 2; // Skip FF D8 SOI

  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const segLen = view.getUint16(offset + 2);

    if (marker === 0xe1) {
      // APP1: check for "Exif\0\0"
      const exifMagic = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7),
      );
      if (exifMagic === "Exif") {
        const tiffStart = offset + 10;
        const byteOrder = view.getUint16(tiffStart);
        const le = byteOrder === 0x4949;
        const getU16 = (o: number) => view.getUint16(tiffStart + o, le);
        const getU32 = (o: number) => view.getUint32(tiffStart + o, le);

        const ifdOffset = getU32(4);
        const entryCount = getU16(ifdOffset);

        for (let i = 0; i < entryCount; i++) {
          const e = ifdOffset + 2 + i * 12;
          if (getU16(e) === 0x010e) {
            // ImageDescription
            const count = getU32(e + 4);
            const valOffset = count <= 4 ? e + 8 : getU32(e + 8);
            const bytes = new Uint8Array(buffer, tiffStart + valOffset, count - 1);
            return new TextDecoder().decode(bytes);
          }
        }
      }
    }
    if (marker === 0xda) break; // SOS
    offset += 2 + segLen;
  }
  return "";
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt: altFallback = "", src }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const { data, isLoading } = useFetch(src, fetchBinary);

  const imageSize = useMemo(() => {
    return data != null ? sizeOf(Buffer.from(data)) : { height: 0, width: 0 };
  }, [data]);

  const alt = useMemo(() => {
    return (data != null ? readJpegImageDescription(data) : "") || altFallback;
  }, [data, altFallback]);

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
