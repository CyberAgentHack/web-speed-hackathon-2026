import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";

interface Props {
  images: Models.Image[];
}

export const ImageArea = ({ images }: Props) => {
  const isFullWidth = images.length === 1;
  const sizes = isFullWidth
    ? "(max-width: 640px) 100vw, 600px"
    : "(max-width: 640px) 50vw, 300px";
  const widths = isFullWidth ? [400, 600, 800] : [200, 300, 400];

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
                "row-span-1":
                  images.length > 2 && (images.length !== 3 || idx !== 0),
                "row-span-2":
                  images.length <= 2 || (images.length === 3 && idx === 0),
              })}
            >
              <CoveredImage image={image} sizes={sizes} widths={widths} />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
