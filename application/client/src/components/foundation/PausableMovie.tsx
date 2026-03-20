import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <img
        alt=""
        className="h-full w-full object-cover"
        src={src}
      />
    </AspectRatioBox>
  );
};
