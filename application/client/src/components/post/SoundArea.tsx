import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";

interface Props {
  prioritizeMedia?: boolean;
  sound: Models.Sound;
}

export const SoundArea = ({ sound, prioritizeMedia = false }: Props) => {
  return (
    <div
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
    >
      <SoundPlayer prioritizeMedia={prioritizeMedia} sound={sound} />
    </div>
  );
};
