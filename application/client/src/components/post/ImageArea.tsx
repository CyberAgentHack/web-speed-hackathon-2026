import classNames from "classnames";
import { lazy, Suspense } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const CoveredImage = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage");
  return { default: mod.CoveredImage };
});

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
              <Suspense fallback={null}>
                <CoveredImage src={getImagePath(image.id)} />
              </Suspense>
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
