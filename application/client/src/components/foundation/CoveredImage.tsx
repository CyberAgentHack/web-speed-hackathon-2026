import { MouseEvent, useCallback, useId, useMemo } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

/** JPEG の EXIF から ImageDescription タグ（0x010E）を取得する */
function parseExifImageDescription(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  if (view.byteLength < 2 || view.getUint16(0) !== 0xffd8) return "";

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xda) break; // SOS: 以降は画像データ

    const segmentLength = view.getUint16(offset + 2);

    if (
      marker === 0xe1 &&
      offset + 10 <= view.byteLength &&
      view.getUint8(offset + 4) === 0x45 && // E
      view.getUint8(offset + 5) === 0x78 && // x
      view.getUint8(offset + 6) === 0x69 && // i
      view.getUint8(offset + 7) === 0x66 && // f
      view.getUint8(offset + 8) === 0x00 &&
      view.getUint8(offset + 9) === 0x00
    ) {
      const tiffStart = offset + 10;
      const le = view.getUint16(tiffStart) === 0x4949;
      if (view.getUint16(tiffStart + 2, le) === 0x002a) {
        const ifd0Offset = view.getUint32(tiffStart + 4, le);
        const entryCount = view.getUint16(tiffStart + ifd0Offset, le);
        for (let i = 0; i < entryCount; i++) {
          const base = tiffStart + ifd0Offset + 2 + i * 12;
          if (base + 12 > view.byteLength) break;
          if (view.getUint16(base, le) !== 0x010e) continue; // ImageDescription
          if (view.getUint16(base + 2, le) !== 2) break; // ASCII 以外は無視
          const count = view.getUint32(base + 4, le);
          if (count === 0) break;
          const valueStart =
            count <= 4 ? base + 8 : tiffStart + view.getUint32(base + 8, le);
          if (valueStart + count > view.byteLength) break;
          return new TextDecoder().decode(new Uint8Array(buffer, valueStart, count - 1));
        }
      }
    }

    offset += 2 + segmentLength;
  }
  return "";
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

  const alt = useMemo(() => {
    return data != null ? parseExifImageDescription(data) : "";
  }, [data]);

  const blobUrl = useMemo(() => {
    return data != null ? URL.createObjectURL(new Blob([data])) : null;
  }, [data]);

  if (isLoading || data === null || blobUrl === null) {
    return null;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="h-full w-full object-cover"
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
