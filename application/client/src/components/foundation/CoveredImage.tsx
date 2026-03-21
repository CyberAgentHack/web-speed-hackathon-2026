import { ImageIFD, load } from "piexifjs";
import { MouseEvent, useCallback, useEffect, useId, useMemo, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
  loading?: "eager" | "lazy";
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します。
 * object-fit: cover を利用してブラウザに cover 計算を委ねます。
 */
export const CoveredImage = ({ src, loading = "lazy" }: Props) => {
  const dialogId = useId();
  const latin1Decoder = useMemo(() => new TextDecoder("latin1"), []);
  // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  // EXIF から alt テキストを取得（画像表示後に遅延で取得）
  const [alt, setAlt] = useState("");
  useEffect(() => {
    const id = requestIdleCallback(() => {
      fetchBinary(src).then((data) => {
        try {
          const binary = latin1Decoder.decode(new Uint8Array(data));
          const exif = load(binary);
          const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
          if (raw == null) return;
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          setAlt(new TextDecoder().decode(bytes));
        } catch {}
      }).catch(() => {});
    });
    return () => cancelIdleCallback(id);
  }, [src, latin1Decoder]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        fetchPriority={loading === "eager" ? "high" : "low"}
        loading={loading}
        src={src}
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
