import { load, ImageIFD } from "piexifjs";
import { MouseEvent, useCallback, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
    alt?: string;
    src: string;
}

function toBinaryString(data: ArrayBuffer): string {
    return Array.from(new Uint8Array(data), (byte) =>
        String.fromCharCode(byte),
    ).join("");
}

function binaryStringToBytes(binary: string): Uint8Array {
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ alt: initialAlt, src }: Props) => {
    const dialogId = useId();
    const [extractedAlt, setExtractedAlt] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    const displayAlt = initialAlt || extractedAlt || "";

    // ダイアログの背景をクリックしたときに投稿詳細ページに遷移しないようにする
    const handleDialogClick = useCallback(
        (ev: MouseEvent<HTMLDialogElement>) => {
            ev.stopPropagation();
        },
        [],
    );

    const handleShowAlt = useCallback(
        async (ev: MouseEvent<HTMLButtonElement>) => {
            ev.stopPropagation();
            if (extractedAlt != null || initialAlt) {
                return;
            }

            setIsExtracting(true);
            try {
                const data = await fetchBinary(src);
                const exif = load(toBinaryString(data));
                const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
                const altText =
                    raw != null
                        ? new TextDecoder().decode(
                              binaryStringToBytes(String(raw)),
                          )
                        : "";
                setExtractedAlt(altText || "説明はありません");
            } catch (e) {
                console.error("Failed to extract ALT:", e);
                setExtractedAlt("ALT の取得に失敗しました");
            } finally {
                setIsExtracting(false);
            }
        },
        [src, extractedAlt, initialAlt],
    );

    return (
        <div className="relative h-full w-full overflow-hidden">
            <img
                alt={displayAlt}
                className="h-full w-full object-cover"
                src={src}
                loading="lazy"
            />

            <button
                className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
                type="button"
                command="show-modal"
                commandfor={dialogId}
                onClick={handleShowAlt}
            >
                {isExtracting ? "取得中..." : "ALT を表示する"}
            </button>

            <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
                <div className="grid gap-y-6">
                    <h1 className="text-center text-2xl font-bold">
                        画像の説明
                    </h1>

                    <p className="text-sm">
                        {isExtracting ? "取得中..." : displayAlt}
                    </p>

                    <Button
                        variant="secondary"
                        command="close"
                        commandfor={dialogId}
                    >
                        閉じる
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
