import { MouseEvent, useCallback, useId, useMemo, useState } from "react";
import { load, ImageIFD } from "piexifjs";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src }: Props) => {
  const dialogId = useId();
  const [shouldLoadAlt, setShouldLoadAlt] = useState(false);

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const { data } = useFetch(shouldLoadAlt ? src : null, fetchBinary);

  const alt = useMemo(() => {
    if (data == null) return "";

    try {
      const exif = load(Buffer.from(data).toString("binary"));
      const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
      return raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "";
    } catch {
      return "";
    }
  }, [data]);

  const handleOpenAlt = useCallback(() => {
    setShouldLoadAlt(true);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        loading="lazy"
        src={src}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
        onClick={handleOpenAlt}
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