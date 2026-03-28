import { memo } from "react";
import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
  prioritizeFirstImage?: boolean;
}

const getCellClassName = (imageCount: number, idx: number) => {
  return classNames("bg-cax-surface-subtle", {
    "col-span-1": imageCount !== 1,
    "col-span-2": imageCount === 1,
    "row-span-1": imageCount > 2 && (imageCount !== 3 || idx !== 0),
    "row-span-2": imageCount <= 2 || (imageCount === 3 && idx === 0),
  });
};

const ImageAreaComponent = ({ images, prioritizeFirstImage = false }: Props) => {
  const imageCount = images.length;

  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          const shouldPrioritize = prioritizeFirstImage && idx === 0;

          return (
            <div key={image.id} className={getCellClassName(imageCount, idx)}>
              <img
                alt={image.alt ?? ""}
                className="h-full w-full object-cover"
                decoding="async"
                fetchPriority={shouldPrioritize ? "high" : "low"}
                loading={shouldPrioritize ? "eager" : "lazy"}
                sizes="(max-width: 640px) 100vw, 640px"
                src={getImagePath(image.id, "thumb")}
                width={640}
                height={360}
              />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};

export const ImageArea = memo(ImageAreaComponent);