import { lazy, Suspense } from "react";

import { MediaPlaceholder } from "@web-speed-hackathon-2026/client/src/components/foundation/MediaPlaceholder";
import { useNearScreen } from "@web-speed-hackathon-2026/client/src/hooks/use_near_screen";

const SoundPlayer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer");
  return { default: mod.SoundPlayer };
});

interface Props {
  sound: Models.Sound;
  interactive?: boolean;
}

export const SoundArea = ({ sound, interactive = true }: Props) => {
  const { isNearScreen, ref } = useNearScreen<HTMLDivElement>({ rootMargin: "400px 0px" });

  return (
    <div
      className={`border-cax-border relative h-full w-full overflow-hidden rounded-lg border ${interactive ? "" : "pointer-events-none"}`.trim()}
      data-sound-area
      ref={ref}
    >
      {isNearScreen ? (
        <Suspense fallback={<MediaPlaceholder className="min-h-20" />}>
          <SoundPlayer sound={sound} />
        </Suspense>
      ) : (
        <MediaPlaceholder className="min-h-20" />
      )}
    </div>
  );
};
