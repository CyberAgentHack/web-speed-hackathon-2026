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
    // clientWidth とアスペクト比から clientHeight を計算する
    function calcStyle() {
      const clientWidth = ref.current?.clientWidth ?? 0;
      setClientHeight((clientWidth / aspectWidth) * aspectHeight);
    }
    setTimeout(() => calcStyle(), 500);

    // ウィンドウサイズが変わるたびに計算する
    window.addEventListener("resize", calcStyle, { passive: false });
    return () => {
      window.removeEventListener("resize", calcStyle);
    };
  }, [aspectHeight, aspectWidth]);

  return (
    <div ref={ref} className="relative h-1 w-full" style={{ height: clientHeight }}>
      {/* 高さが計算できるまで render しない */}
      {clientHeight !== 0 ? <div className="absolute inset-0">{children}</div> : null}
    </div>
  );
};
