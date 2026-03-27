import { useEffect, useRef, useState } from "react";

import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";

interface Props {
  sound: Models.Sound;
  priority?: boolean;
}

export const SoundArea = ({ sound, priority = false }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priority);

  useEffect(() => {
    if (priority) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <div
      ref={ref}
      className="border-cax-border relative h-full w-full overflow-hidden rounded-lg border"
      data-sound-area
    >
      {visible ? <SoundPlayer sound={sound} /> : null}
    </div>
  );
};
