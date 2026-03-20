import classNames from "classnames";

import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
}

export const ImageArea = ({ images }: Props) => {
  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
      <div className="border-cax-border absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          return (
            <div
              key={image.id}
              // CSS Grid で表示領域を指定する
              className={classNames("bg-cax-surface-subtle", {
                "col-span-1": images.length !== 1,
                "col-span-2": images.length === 1,
                "row-span-1": images.length > 2 && (images.length !== 3 || idx !== 0),
                "row-span-2": images.length <= 2 || (images.length === 3 && idx === 0),
              })}
            >
              <CoveredImage alt={image.alt} src={getImagePath(image.id)} loading={idx === 0 ? "eager" : "lazy"} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
