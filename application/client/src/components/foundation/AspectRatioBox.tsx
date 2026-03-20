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
    const element = ref.current;
    if (element == null) {
      return;
    }

    // clientWidth とアスペクト比から clientHeight を計算する
    function calcStyle() {
      const clientWidth = element.clientWidth;
      setClientHeight(clientWidth === 0 ? 0 : (clientWidth / aspectWidth) * aspectHeight);
    }

    calcStyle();

    const resizeObserver = new ResizeObserver(() => {
      calcStyle();
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectHeight, aspectWidth]);

  return (
    <div ref={ref} className="relative h-1 w-full" style={{ height: clientHeight }}>
      {/* 高さが計算できるまで render しない */}
      {clientHeight !== 0 ? <div className="absolute inset-0">{children}</div> : null}
    </div>
  );
};
