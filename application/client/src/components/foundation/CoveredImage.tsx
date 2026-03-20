import { load, ImageIFD } from "piexifjs";
import { MouseEvent, useCallback, useId, useMemo } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useObjectUrl } from "@web-speed-hackathon-2026/client/src/hooks/use_object_url";
import { fetchBinaryCached } from "@web-speed-hackathon-2026/client/src/utils/fetch_binary_cached";

interface Props {
  src: string;
}

const altCache = new WeakMap<ArrayBuffer, string>();

function extractAlt(data: ArrayBuffer): string {
  if (altCache.has(data)) {
    return altCache.get(data) ?? "";
  }

  try {
    const exif = load(Buffer.from(data).toString("binary"));
    const raw = exif["0th"]?.[ImageIFD.ImageDescription];
    const alt = raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "";
    altCache.set(data, alt);
    return alt;
  } catch {
    altCache.set(data, "");
    return "";
  }
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

  const { data, isLoading } = useFetch(src, fetchBinaryCached);

  const alt = useMemo(() => {
    if (data === null) {
      return "";
    }

    return extractAlt(data);
  }, [data]);

  const blobUrl = useObjectUrl(data);

  if (isLoading || data === null || blobUrl === null) {
    return null;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img alt={alt} className="absolute inset-0 h-full w-full object-cover" src={blobUrl} />

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
