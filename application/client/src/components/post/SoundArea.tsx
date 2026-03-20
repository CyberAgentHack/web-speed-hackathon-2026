import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";
import { useIntersectionObserver } from "@web-speed-hackathon-2026/client/src/hooks/use_intersection_observer";

const OBSERVER_OPTIONS: IntersectionObserverInit = { rootMargin: "200px" };

interface Props {
  sound: Models.Sound;
}

export const SoundArea = ({ sound }: Props) => {
  const [ref, isVisible] = useIntersectionObserver(OBSERVER_OPTIONS);

  return (
    <div
      ref={ref}
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
    >
      {isVisible ? <SoundPlayer sound={sound} /> : null}
    </div>
  );
};
