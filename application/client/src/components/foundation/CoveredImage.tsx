import classNames from "classnames";
import { MouseEvent, useCallback, useEffect, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  src: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, loading = "lazy", fetchPriority = "auto" }: Props) => {
  const dialogId = useId();
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const [alt, setAlt] = useState("");
  const [shouldParseExif, setShouldParseExif] = useState(false);
  const [isExifParsed, setIsExifParsed] = useState(false);

  useEffect(() => {
    if (!shouldParseExif || isExifParsed) return;
    setIsExifParsed(true);

    const schedule = (cb: () => void) => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (fn: () => void) => void }).requestIdleCallback(cb);
      } else {
        setTimeout(cb, 0);
      }
    };

    schedule(() => {
      void (async () => {
        try {
          const mod = await import("piexifjs");
          const { load, ImageIFD } = mod as typeof import("piexifjs");

          const resp = await fetch(src, { method: "GET" });
          if (!resp.ok) return;

          const buf = await resp.arrayBuffer();
          const exif = load(Buffer.from(buf).toString("binary"));
          const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
          const decoded =
            raw != null ? new TextDecoder().decode(Buffer.from(raw, "binary")) : "";
          setAlt(decoded);
        } catch {
          // ALT は空でも致命ではないため握りつぶします
        }
      })();
    });
  }, [isExifParsed, shouldParseExif, src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={classNames("absolute inset-0 h-full w-full object-cover")}
        src={src}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
        onClick={() => setShouldParseExif(true)}
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
