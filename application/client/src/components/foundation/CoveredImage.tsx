import classNames from "classnames";
import { MouseEvent, useId, useCallback, useState, memo } from "react";
import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  src: string;
}

export const CoveredImage = memo(({ src }: Props) => {
  const dialogId = useId();
  const [alt, setAlt] = useState("");

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  // 画像が読み終わった後に、重い解析を非同期で行う
  const handleLoad = useCallback(async () => {
    try {
      // 必要な時だけ重いライブラリを読み込む (Code Splitting)
      const [{ load, ImageIFD }, { default: sizeOf }] = await Promise.all([
        import("piexifjs"),
        import("image-size"),
      ]);

      const response = await fetch(src);
      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // EXIF解析
      const exif = load(Buffer.from(uint8Array).toString("binary"));
      const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
      if (raw) {
        setAlt(new TextDecoder().decode(Buffer.from(raw, "binary")));
      }
    } catch (e) {
      console.error("Failed to parse EXIF", e);
    }
  }, [src]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-cax-surface-dimmed">
      <img
        alt={alt}
        src={src}
        // CSSで完結させる（JSでの計算を排除）
        className="h-full w-full object-cover"
        // パフォーマンス設定
        loading="lazy"
        decoding="async"
        // 読み込み完了後に解析を開始（メインスレッドのブロックを避ける）
        onLoad={handleLoad}
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
          <p className="text-sm">{alt || "読み込み中、または説明がありません"}</p>
          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
});

CoveredImage.displayName = "CoveredImage";
