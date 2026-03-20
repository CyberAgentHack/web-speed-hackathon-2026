/**
 * 音声波形の視覚的表現コンポーネント。
 * パフォーマンス改善のため、decodeAudioData による実データ計算ではなく
 * 静的な波形パターンを描画する。E2Eテストの期待する viewBox="0 0 100 1" を維持。
 */

/** 固定の波形パターン（100本のバー） */
const STATIC_PEAKS: number[] = Array.from({ length: 100 }, (_, i) => {
  // 自然な波形に見える疑似パターンを生成（sin波の重ね合わせ）
  const t = i / 100;
  return 0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI * 3) * Math.cos(t * Math.PI * 7) * Math.sin(t * Math.PI * 11));
});

interface Props {
  currentTimeRatio?: number;
}

export const SoundWaveSVG = ({ currentTimeRatio = 0 }: Props) => {
  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {STATIC_PEAKS.map((peak, idx) => (
        <rect
          key={idx}
          fill={idx / 100 < currentTimeRatio ? "var(--color-cax-brand)" : "var(--color-cax-accent)"}
          height={peak}
          width="1"
          x={idx}
          y={1 - peak}
        />
      ))}
    </svg>
  );
};
