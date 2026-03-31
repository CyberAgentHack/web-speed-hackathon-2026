import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";
import { getImageAspectRatio } from "@web-speed-hackathon-2026/client/src/utils/media_aspect_ratio";

interface Props {
  images: Models.Image[];
  prioritizeFirstImage?: boolean;
}

export const ImageArea = ({ images, prioritizeFirstImage = false }: Props) => {
  const { aspectHeight, aspectWidth } = getImageAspectRatio(images[0]);

  return (
    <AspectRatioBox aspectHeight={aspectHeight} aspectWidth={aspectWidth}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
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
              <CoveredImage
                alt={image.alt}
                fetchPriority={prioritizeFirstImage && idx === 0 ? "high" : "auto"}
                loading={prioritizeFirstImage && idx === 0 ? "eager" : "lazy"}
                src={getImagePath(image.id)}
              />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
