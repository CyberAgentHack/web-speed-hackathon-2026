import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";
import { useActivateOnceVisible } from "@web-speed-hackathon-2026/client/src/hooks/use_activate_once_visible";

interface Props {
  sound: Models.Sound;
}

export const SoundArea = ({ sound }: Props) => {
  const { isActive, targetRef } = useActivateOnceVisible<HTMLDivElement>();

  return (
    <div
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
      ref={targetRef}
    >
      {isActive ? <SoundPlayer sound={sound} /> : null}
    </div>
  );
};
