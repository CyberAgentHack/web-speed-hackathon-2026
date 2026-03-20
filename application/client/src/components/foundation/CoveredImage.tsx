import classNames from "classnames";
import { RefCallback, useCallback, useState } from "react";

interface Props {
  src: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({ src, loading = "lazy", fetchPriority = "auto" }: Props) => {
  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    setContainerSize({
      height: el?.clientHeight ?? 0,
      width: el?.clientWidth ?? 0,
    });
  }, []);

  const containerRatio = containerSize.height / containerSize.width || 1;

  return (
    <div ref={callbackRef} className="relative h-full w-full overflow-hidden">
      <img
        alt=""
        className={classNames(
          "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2",
          {
            "w-auto h-full": containerRatio > 1,
            "w-full h-auto": containerRatio <= 1,
          },
        )}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        src={src}
      />
    </div>
  );
};
