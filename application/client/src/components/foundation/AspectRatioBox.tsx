import { ReactNode, useCallback, useRef, useState } from "react";

interface Props {
  aspectHeight: number;
  aspectWidth: number;
  children: ReactNode;
}

/**
 * 親要素の横幅を基準にして、指定したアスペクト比のブロック要素を作ります
 */
export const AspectRatioBox = ({ aspectHeight, aspectWidth, children }: Props) => {
  const [clientHeight, setClientHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const callbackRef = useCallback(
    (el: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      if (el == null) return;

      const update = () => {
        const clientWidth = el.clientWidth;
        setClientHeight((clientWidth / aspectWidth) * aspectHeight);
      };

      observerRef.current = new ResizeObserver(update);
      observerRef.current.observe(el);
      update();
    },
    [aspectHeight, aspectWidth],
  );

  return (
    <div ref={callbackRef} className="relative h-1 w-full" style={{ height: clientHeight }}>
      {clientHeight !== 0 ? <div className="absolute inset-0">{children}</div> : null}
    </div>
  );
};
