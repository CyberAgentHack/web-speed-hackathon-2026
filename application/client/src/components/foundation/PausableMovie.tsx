
interface Props {
  src: string;
}

/**
 * 以前は手動デコードによる一時停止機能を実装していましたが、パフォーマンス改善のためネイティブのimgタグに置き換えました。
 */
export const PausableMovie = ({ src }: Props) => {
  return (
    <img
      src={src}
      alt="GIFアニメーション"
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  );
};
