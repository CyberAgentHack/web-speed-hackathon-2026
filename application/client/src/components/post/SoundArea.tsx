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
      {isActive ? (
        <SoundPlayer sound={sound} />
      ) : (
        <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center p-2">
          <div className="flex h-full min-w-0 shrink grow flex-col pt-2">
            <p className="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
              {sound.title}
            </p>
            <p className="text-cax-text-muted overflow-hidden text-sm text-ellipsis whitespace-nowrap">
              {sound.artist}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
