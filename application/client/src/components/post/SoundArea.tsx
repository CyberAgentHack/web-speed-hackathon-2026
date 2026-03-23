import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";

interface Props {
  sound: Models.Sound;
  isFirst: boolean;
}

export const SoundArea = ({ sound, isFirst }: Props) => {
  return (
    <div
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
    >
      <SoundPlayer sound={sound} preload={isFirst ? "auto" : "none"} />
    </div>
  );
};
