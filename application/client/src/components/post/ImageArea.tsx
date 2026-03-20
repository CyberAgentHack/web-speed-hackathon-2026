import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import { getImagePath, getImageSrcSet } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
}

export const ImageArea = ({ images }: Props) => {
  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
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
                src={getImagePath(image.id)}
                srcSet={getImageSrcSet(image.id)}
                sizes={images.length === 1 ? "(min-width: 640px) 640px, 100vw" : "(min-width: 640px) 320px, 50vw"}
              />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
