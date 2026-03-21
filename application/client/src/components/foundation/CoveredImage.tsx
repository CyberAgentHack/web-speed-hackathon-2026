import { MouseEvent, useCallback, useId, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
    alt?: string;
    fetchPriority?: "auto" | "high" | "low";
    height?: number;
    loading?: "eager" | "lazy";
    src: string;
    width?: number;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({
    alt: initialAlt,
    fetchPriority = "auto",
    height,
    loading = "lazy",
    src,
    width,
}: Props) => {
    const dialogId = useId();
    const [extractedAlt, setExtractedAlt] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

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
                const response = await fetchJSON<{ alt: string }>(
                    `/api/v1/images/alt?src=${encodeURIComponent(src)}`,
                );
                const altText = response.alt;
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
            {!isLoaded ? (
                <div
                    aria-hidden="true"
                    className="bg-cax-surface-subtle absolute inset-0"
                />
            ) : null}

            <img
                alt={displayAlt}
                className="h-full w-full object-cover"
                src={src}
                fetchPriority={fetchPriority}
                height={height}
                loading={loading}
                width={width}
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsLoaded(true)}
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
