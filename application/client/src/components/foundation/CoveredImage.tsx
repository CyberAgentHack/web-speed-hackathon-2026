import { Buffer } from "buffer";
import classNames from "classnames";
import sizeOf from "image-size";
import { load, ImageIFD } from "piexifjs";
import { MouseEvent, RefCallback, useCallback, useId, useMemo, useState, useRef } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  image: Models.Image;
  isPriority?: boolean;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ image }: Props) => {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const src = getImagePath(image.id);

  const handleShowModal = useCallback(() => {
    const el = document.getElementById(dialogId) as HTMLDialogElement;
    el?.showModal();
  }, [dialogId]);

  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const { data, isLoading } = useFetch(src, fetchBinary);

  const imageSize = useMemo(() => {
    try {
      if (data == null) return { height: 0, width: 0 };
      console.log("CoveredImage: calculating size for", image.id);
      return sizeOf(Buffer.from(data));
    } catch (e) {
      console.error("CoveredImage: image-size error for", image.id, e);
      return { height: 0, width: 0 };
    }
  }, [data, image.id]);

  const alt = useMemo(() => {
    const fallback = image.alt || "説明はありません";
    try {
      if (data == null) return fallback;
      const exif = load(Buffer.from(data).toString("binary"));
      const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
      return raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : fallback;
    } catch (e) {
      // EXIF extraction might fail for non-JPEG images, fallback to image.alt
      return fallback;
    }
  }, [data, image.alt]);

  const blobUrl = useMemo(() => {
    try {
      if (data == null) return null;
      return URL.createObjectURL(new Blob([data]));
    } catch (e) {
      return null;
    }
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
  const imageRatio = (imageSize?.height ?? 0) / (imageSize?.width ?? 1);

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
        onClick={handleShowModal}
      >
        ALT を表示する
      </button>

      <Modal ref={dialogRef} id={dialogId} closedby="any" onClick={handleDialogClick}>
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
