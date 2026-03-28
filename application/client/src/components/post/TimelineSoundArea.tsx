interface Props {
  sound: Models.Sound;
}

/**
 * ホームタイムライン専用の軽量表示。
 * 一覧ではメタ情報のみ表示し、重い波形描画や音声デコードを避ける。
 */
export const TimelineSoundArea = ({ sound }: Props) => {
  return (
    <div
      className="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border p-3"
      data-sound-area
    >
      <p className="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
        {sound.title}
      </p>
      <p className="text-cax-text-muted overflow-hidden text-sm text-ellipsis whitespace-nowrap">
        {sound.artist}
      </p>
    </div>
  );
};
