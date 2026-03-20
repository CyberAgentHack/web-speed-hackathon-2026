import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  aspectHeight: number;
  aspectWidth: number;
  children: ReactNode;
}

/**
 * 親要素の横幅を基準にして、指定したアスペクト比のブロック要素を作ります
 */
export const AspectRatioBox = ({ aspectHeight, aspectWidth, children }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [clientHeight, setClientHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setClientHeight((width / aspectWidth) * aspectHeight);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [aspectHeight, aspectWidth]);

  return (
    <div ref={ref} className="relative w-full" style={{ height: clientHeight }}>
      {clientHeight !== 0 ? <div className="absolute inset-0">{children}</div> : null}
    </div>
  );
};
