import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

/**
 * 標準の audio タグを使用した軽量な音声プレイヤー
 */
export const SoundPlayer = ({ sound }: Props) => {
  return (
    <div className="bg-cax-surface-subtle flex h-full w-full flex-col items-center justify-center p-4 rounded-lg">
      <p className="font-bold mb-2 text-sm text-cax-text overflow-hidden text-ellipsis whitespace-nowrap w-full text-center">
        {sound.title} / {sound.artist}
      </p>
      <audio 
        src={getSoundPath(sound.id)} 
        controls 
        preload="none" 
        className="w-full h-8" 
      />
    </div>
  );
};
