import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";
import { useInViewOnce } from "@web-speed-hackathon-2026/client/src/hooks/use_in_view_once";

const IN_VIEW_OPTIONS: IntersectionObserverInit = { rootMargin: "200px 0px" };

interface Props {
  sound: Models.Sound;
}

export const SoundArea = ({ sound }: Props) => {
  const [ref, isInView] = useInViewOnce<HTMLDivElement>(IN_VIEW_OPTIONS);
  const shouldLoad = isInView;

  return (
    <div
      ref={ref}
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
    >
      {shouldLoad ? <SoundPlayer sound={sound} /> : <div className="bg-cax-surface-subtle h-24 w-full animate-pulse" />}
    </div>
  );
};
