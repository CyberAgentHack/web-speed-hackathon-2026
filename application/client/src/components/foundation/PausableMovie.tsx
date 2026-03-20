import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
}

/**
 * ブラウザ標準の GIF 描画に任せて、初期表示時の重い同期デコードを避けます。
 */
export const PausableMovie = ({ src }: Props) => {
  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <img
        alt=""
        className="h-full w-full object-cover"
        decoding="async"
        loading="lazy"
        src={src}
      />
    </AspectRatioBox>
  );
};
