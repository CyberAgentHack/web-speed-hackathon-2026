import classNames from "classnames";
import { MouseEvent, RefCallback, useCallback, useId, useMemo, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
  loading?: "lazy" | "eager";
}

let altTextsCache: Record<string, string> | null = null;

async function fetchAltTexts(url: string): Promise<Record<string, string>> {
  if (altTextsCache != null) return altTextsCache;
  const data = await fetchJSON<Record<string, string>>(url);
  altTextsCache = data;
  return data;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, loading = "lazy" }: Props) => {
  const dialogId = useId();
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const { data: altTexts } = useFetch("/images/alt_texts.json", fetchAltTexts);

  const alt = useMemo(() => {
    if (altTexts == null) return "";
    // Extract image ID from src like "/images/{id}.avif"
    const match = src.match(/\/images\/([^/]+)\.\w+$/);
    if (match == null) return "";
    return altTexts[match[1]!] ?? "";
  }, [altTexts, src]);

  const [imageSize, setImageSize] = useState({ height: 0, width: 0 });
  const imgRef = useCallback<RefCallback<HTMLImageElement>>((el) => {
    if (el == null) return;
    const handleLoad = () => {
      setImageSize({ height: el.naturalHeight, width: el.naturalWidth });
    };
    if (el.complete) {
      handleLoad();
    } else {
      el.addEventListener("load", handleLoad, { once: true });
    }
  }, []);

  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    setContainerSize({
      height: el?.clientHeight ?? 0,
      width: el?.clientWidth ?? 0,
    });
  }, []);

  const containerRatio = containerSize.height / containerSize.width;
  const imageRatio = imageSize.height / imageSize.width;

  return (
    <div ref={callbackRef} className="relative h-full w-full overflow-hidden">
      <img
        ref={imgRef}
        alt={alt}
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": containerRatio > imageRatio,
            "w-full h-auto": containerRatio <= imageRatio,
          },
        )}
        loading={loading}
        sizes="(max-width: 768px) 100vw, 600px"
        src={src}
        srcSet={`${src}${src.includes("?") ? "&" : "?"}w=320 320w, ${src}${src.includes("?") ? "&" : "?"}w=640 640w, ${src}${src.includes("?") ? "&" : "?"}w=960 960w, ${src}${src.includes("?") ? "&" : "?"}w=1200 1200w`}
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
