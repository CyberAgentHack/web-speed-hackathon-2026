import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface AspectRatioPlaceholderProps {
  aspectHeight: number;
  aspectWidth: number;
}

export const AspectRatioMediaPlaceholder = ({
  aspectHeight,
  aspectWidth,
}: AspectRatioPlaceholderProps) => {
  return (
    <AspectRatioBox aspectHeight={aspectHeight} aspectWidth={aspectWidth}>
      <div
        aria-hidden={true}
        className="border-cax-border bg-cax-surface-subtle h-full w-full rounded-lg border"
      />
    </AspectRatioBox>
  );
};

export const SoundMediaPlaceholder = () => {
  return (
    <div
      aria-hidden={true}
      className="border-cax-border bg-cax-surface-subtle h-24 w-full rounded-lg border sm:h-28"
    />
  );
};
