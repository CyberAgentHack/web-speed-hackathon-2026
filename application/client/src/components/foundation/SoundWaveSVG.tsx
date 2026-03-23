const BARS = Array.from({ length: 100 }, (_, i) => {
  const height = 0.3 + Math.sin(i * 0.3) * 0.2;
  return { i, height };
});

export const SoundWaveSVG = () => {
  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {BARS.map(({ i, height }) => (
        <rect
          key={i}
          fill="var(--color-cax-accent)"
          height={height}
          width="1"
          x={i}
          y={1 - height}
        />
      ))}
    </svg>
  );
};
