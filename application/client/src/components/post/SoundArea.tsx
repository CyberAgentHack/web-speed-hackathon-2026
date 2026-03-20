import { lazy, Suspense } from "react";

const SoundPlayer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer");
  return { default: mod.SoundPlayer };
});

interface Props {
  sound: Models.Sound;
}

export const SoundArea = ({ sound }: Props) => {
  return (
    <div
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
    >
      <Suspense fallback={null}>
        <SoundPlayer sound={sound} />
      </Suspense>
    </div>
  );
};
