import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
}

export const ImageArea = ({ images }: Props) => {
  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full gap-1 overflow-hidden rounded-lg border [grid-template-columns:repeat(2,minmax(0,1fr))] [grid-template-rows:repeat(2,minmax(0,1fr))]">
        {images.map((image, idx) => {
          return (
            <div
              key={image.id}
              // CSS Grid で表示領域を指定する
              className={classNames("min-h-0 min-w-0 bg-cax-surface-subtle", {
                "col-span-1": images.length !== 1,
                "col-span-2": images.length === 1,
                "row-span-1": images.length > 2 && (images.length !== 3 || idx !== 0),
                "row-span-2": images.length <= 2 || (images.length === 3 && idx === 0),
              })}
            >
              <CoveredImage alt={image.alt} src={getImagePath(image.id)} />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
