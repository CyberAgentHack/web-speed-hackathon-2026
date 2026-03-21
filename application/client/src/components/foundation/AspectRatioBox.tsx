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
  const [clientHeight, setClientHeight] = useState(1);

  useEffect(() => {
    // clientWidth とアスペクト比から clientHeight を計算する
    function calcStyle() {
      const clientWidth = ref.current?.clientWidth ?? 0;
      if (clientWidth === 0) {
        return;
      }
      setClientHeight((clientWidth / aspectWidth) * aspectHeight);
    }
    calcStyle();
    requestAnimationFrame(calcStyle);

    // ウィンドウサイズが変わるたびに計算する
    window.addEventListener("resize", calcStyle, { passive: true });
    return () => {
      window.removeEventListener("resize", calcStyle);
    };
  }, [aspectHeight, aspectWidth]);

  return (
    <div ref={ref} className="relative h-1 w-full" style={{ height: clientHeight }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
};
