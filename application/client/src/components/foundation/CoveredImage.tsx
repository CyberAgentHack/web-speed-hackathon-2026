import { MouseEvent, useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  alt: string;
  fetchPriority?: "high" | "low" | "auto";
  loading?: "eager" | "lazy";
  src: string;
}

export const CoveredImage = ({ alt, fetchPriority, loading = "eager", src }: Props) => {
  const dialogId = useId();
  const [modalMounted, setModalMounted] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  const handleAltClick = useCallback(() => {
    if (modalMounted) {
      dialogRef.current?.showModal();
    } else {
      setModalMounted(true);
      setPendingOpen(true);
    }
  }, [modalMounted]);

  useEffect(() => {
    if (pendingOpen && dialogRef.current) {
      dialogRef.current.showModal();
      setPendingOpen(false);
    }
  }, [pendingOpen]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority={fetchPriority}
        loading={loading}
        src={src}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        onClick={handleAltClick}
      >
        ALT を表示する
      </button>

      {modalMounted && (
        <Modal ref={dialogRef} id={dialogId} closedby="any" onClick={handleDialogClick}>
          <div className="grid gap-y-6">
            <h1 className="text-center text-2xl font-bold">画像の説明</h1>

            <p className="text-sm">{alt}</p>

            <Button variant="secondary" command="close" commandfor={dialogId}>
              閉じる
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
