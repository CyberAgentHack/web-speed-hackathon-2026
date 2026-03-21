import classNames from "classnames";
import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  images: Models.Image[];
}

export const ImageArea = ({ images }: Props) => {
  const length = images.length;

  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          const isSingle = length === 1;
          const isDoubleOrLess = length <= 2;
          const isThreeMain = length === 3 && idx === 0;

          return (
            <div
              key={image.id}
              className={classNames("bg-cax-surface-subtle", {
                "col-span-2": isSingle,
                "col-span-1": !isSingle,
                "row-span-2": isDoubleOrLess || isThreeMain,
                "row-span-1": !isDoubleOrLess && !isThreeMain,
              })}
            >
              <CoveredImage
                src={getImagePath(image.id)}
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
