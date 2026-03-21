import classNames from "classnames";

import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  fetchPriority?: "auto" | "high" | "low";
  images: Models.Image[];
  loading?: "eager" | "lazy";
}

export const ImageArea = ({ images, loading, fetchPriority }: Props) => {
  const hasSingleImage = images.length === 1;

  return (
    <div className="aspect-video">
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          const imagePath = hasSingleImage
            ? getImagePath(image.id)
            : getImagePath(image.id, 300);

          return (
            <div
              key={image.id}
              // CSS Grid で表示領域を指定する
              className={classNames("bg-cax-surface-subtle", {
                "col-span-1": !hasSingleImage,
                "col-span-2": hasSingleImage,
                "row-span-1": images.length > 2 && (images.length !== 3 || idx !== 0),
                "row-span-2": images.length <= 2 || (images.length === 3 && idx === 0),
              })}
            >
              <CoveredImage
                alt={image.alt}
                fetchPriority={fetchPriority}
                height={image.height}
                loading={loading}
                src={imagePath}
                width={image.width}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
