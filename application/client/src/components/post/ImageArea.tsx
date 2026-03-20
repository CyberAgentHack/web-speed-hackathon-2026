import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
  fetchPriority?: "high" | "low" | "auto";
}

export const ImageArea = ({ images, fetchPriority = "auto" }: Props) => {
  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          const sizes =
            images.length === 1
              ? "(max-width: 640px) calc(100vw - 32px), 640px"
              : "(max-width: 640px) calc((100vw - 36px) / 2), 320px";

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
                src={getImagePath(image.id)}
                width={image.width}
                height={image.height}
                fetchPriority={idx === 0 ? fetchPriority : "auto"}
                sizes={sizes}
              />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
