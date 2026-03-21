import classNames from "classnames";
import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
}

export const ImageArea = ({ images }: Props) => {
  const length = images.length;

  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          const isSingle = length === 1;
          const isDoubleOrLess = length <= 2;
          const isThreeMain = length === 3 && idx === 0;

          return (
            <div
              key={image.id}
              className={classNames("bg-cax-surface-subtle relative", {
                "col-span-2": isSingle,
                "col-span-1": !isSingle,
                "row-span-2": isDoubleOrLess || isThreeMain,
                "row-span-1": !isDoubleOrLess && !isThreeMain,
              })}
            >
              {/* --- 修正ポイント：img タグに直接 width/height を指定 --- */}
              <img
                src={getImagePath(image.id)}
                alt=""
                // レイアウトシフトを防ぐためにアスペクト比に基づいたサイズを明示
                width={1600}
                height={900}
                // CSSで親要素の枠いっぱいに広げる（object-cover で切り抜き）
                className="h-full w-full object-cover"
                // 1枚目だけ即時読み込み（LCP対策）、それ以外は遅延読み込み
                loading={idx === 0 ? "eager" : "lazy"}
                // 画像展開を非同期にしてメインスレッドの負荷を軽減
                decoding="async"
              />
              {/* ---------------------------------------------------- --- */}
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};