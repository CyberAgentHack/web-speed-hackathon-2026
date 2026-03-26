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

    // まず即時に計算（子要素の遅延描画を避ける）
    calcStyle();

    // レイアウト変化をより確実に追う
    const element = ref.current;
    if (element && "ResizeObserver" in window) {
      const ro = new ResizeObserver(() => calcStyle());
      ro.observe(element);
      return () => ro.disconnect();
    }

    // ResizeObserver が使えない環境向けフォールバック
    window.addEventListener("resize", calcStyle, { passive: true });
    return () => window.removeEventListener("resize", calcStyle);
  }, [aspectHeight, aspectWidth]);

  return (
    <div ref={ref} className="relative h-1 w-full" style={{ height: clientHeight }}>
      {/* 高さが計算できるまで render しない */}
      {clientHeight !== 0 ? <div className="absolute inset-0">{children}</div> : null}
    </div>
  );
};
