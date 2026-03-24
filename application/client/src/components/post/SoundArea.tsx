import { Suspense, lazy } from "react";

const SoundPlayer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer").then((m) => ({
    default: m.SoundPlayer,
  })),
);

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
