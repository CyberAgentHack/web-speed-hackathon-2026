import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";

interface Props {
  sound: Models.Sound;
  lazy?: boolean;
}

export const SoundArea = ({ sound, lazy }: Props) => {
  return (
    <div
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
    >
      <SoundPlayer sound={sound} lazy={lazy} />
    </div>
  );
};
