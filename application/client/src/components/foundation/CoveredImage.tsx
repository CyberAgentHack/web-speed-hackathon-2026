import { MouseEvent, useCallback, useEffect, useId, useMemo } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { load, ImageIFD } from "piexifjs";

interface Props {
  alt: string;
  src: string;
}

const CoveredImageWithExifAlt = ({
  src,
  alt,
  dialogId,
  onDialogClick,
}: {
  src: string;
  alt: string;
  dialogId: string;
  onDialogClick: (ev: MouseEvent<HTMLDialogElement>) => void;
}) => {
  const { data } = useFetch(src, fetchBinary);

  const parsedAlt = useMemo(() => {
    if (data == null) {
      return "";
    }

    // piexifjs は「ImageDescription」を 0th IFD の ImageIFD.ImageDescription から取り出す
    const exif = load(Buffer.from(data).toString("binary"));
    const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
    return raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "";
  }, [data]);

  const altToShow = parsedAlt || alt;

  const blobUrl = useMemo(() => {
    return data != null ? URL.createObjectURL(new Blob([data])) : null;
  }, [data]);

  // blobUrl を作りっぱなしにしない
  useEffect(() => {
    if (blobUrl == null) {
      return;
    }
    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={altToShow}
        className="absolute inset-0 h-full w-full object-cover"
        src={blobUrl ?? src}
        loading="lazy"
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={onDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{altToShow}</p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt, src }: Props) => {
  const dialogId = useId();
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  // `Image.alt` が空の場合だけ、EXIF(ImageDescription)から alt を復元する
  if (alt.trim() !== "") {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <img
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          loading="lazy"
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
  }

  return (
    <CoveredImageWithExifAlt
      src={src}
      alt={alt}
      dialogId={dialogId}
      onDialogClick={handleDialogClick}
    />
  );
};
