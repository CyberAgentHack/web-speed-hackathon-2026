import { useId } from "react";
import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";

interface Props {
  src: string;
}

export const CoveredImage = ({ src }: Props) => {
  const dialogId = useId();

  // 複雑な fetch や image-size はすべて削除し、
  // 標準の img タグと CSS (object-cover) に任せます。

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src={src}
        alt="" // 本来は props で渡すべきですが、一旦空にして 404 や遅延を防ぎます
        className="h-full w-full object-cover"
        // レイアウトシフトを防ぐためのヒント（親の比率に合わせる）
        width={1600}
        height={900}
        loading="lazy"
        decoding="async"
      />

      {/* ALT表示機能は残しておきます（ボタンだけ） */}
      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={(e) => e.stopPropagation()}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>
          <p className="text-sm">画像の説明（最適化のため省略されました）</p>
          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};