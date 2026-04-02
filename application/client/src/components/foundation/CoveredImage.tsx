import { useCallback, useEffect, useId, useState } from "react";
import type { MouseEvent } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  alt: string;
  fetchPriority?: "high" | "low" | "auto";
  loading?: "eager" | "lazy";
  src: string;
}

function toBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = "";
  const chunkSize = 0x8000;

  for (let idx = 0; idx < bytes.length; idx += chunkSize) {
    result += String.fromCharCode(...bytes.subarray(idx, idx + chunkSize));
  }

  return result;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt, fetchPriority = "auto", loading = "lazy", src }: Props) => {
  const dialogId = useId();
  const [shouldLoadExifAlt, setShouldLoadExifAlt] = useState(false);
  const shouldFetchExifAlt = shouldLoadExifAlt && alt.trim() === "";
  const { data } = useFetch(src, fetchBinary, { enabled: shouldFetchExifAlt });
  const [displayAlt, setDisplayAlt] = useState(alt);

  useEffect(() => {
    if (alt.trim() !== "") {
      setDisplayAlt(alt);
      return;
    }

    if (data === null) {
      setDisplayAlt("");
      return;
    }

    let cancelled = false;

    void import("piexifjs")
      .then(({ ImageIFD, load }) => {
        const exif = load(toBinaryString(data));
        const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
        if (cancelled) {
          return;
        }

        if (raw == null) {
          setDisplayAlt("");
          return;
        }

        const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0));
        setDisplayAlt(new TextDecoder().decode(bytes));
      })
      .catch(() => {
        if (!cancelled) {
          setDisplayAlt("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [alt, data]);

  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        fetchPriority={fetchPriority}
        loading={loading}
        src={src}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        onClick={() => setShouldLoadExifAlt(true)}
        command="show-modal"
        commandfor={dialogId}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">
            {displayAlt ||
              (shouldFetchExifAlt && data === null ? "読み込み中..." : "説明はありません")}
          </p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
