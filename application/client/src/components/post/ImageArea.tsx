import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import {
  getImagePath,
  getImageSources,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
  prioritizeFirstImage?: boolean;
}

export const ImageArea = ({ images, prioritizeFirstImage = false }: Props) => {
  const isSingleImage = images.length === 1;
  const sizes = isSingleImage
    ? "(max-width: 640px) calc(100vw - 1rem), (max-width: 1024px) 560px, 640px"
    : "(max-width: 640px) calc((100vw - 1rem) / 2), (max-width: 1024px) 280px, 320px";

  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          const srcSet = [320, 480, 640, 960]
            .map((width) => `${getImagePath(image.id, { w: width })} ${width}w`)
            .join(", ");
          const src = getImagePath(image.id, { w: prioritizeFirstImage && idx === 0 ? 960 : 640 });
          const sources = getImageSources(image.id, {}, sizes);

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
                priority={prioritizeFirstImage && idx === 0}
                sources={sources.slice(0, 2)}
                sizes={sizes}
                src={src}
                srcSet={srcSet}
              />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
