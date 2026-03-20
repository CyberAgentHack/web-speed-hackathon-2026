import { getSoundWaveformPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  prioritizeMedia?: boolean;
  soundId: string;
}

export const SoundWaveSVG = ({ soundId, prioritizeMedia = false }: Props) => {
  return (
    <img
      alt=""
      className="h-full w-full"
      fetchPriority={prioritizeMedia ? "high" : "auto"}
      loading={prioritizeMedia ? "eager" : "lazy"}
      src={getSoundWaveformPath(soundId)}
    />
  );
};
