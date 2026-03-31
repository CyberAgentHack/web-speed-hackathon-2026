interface Props {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * 軽量な画像コンポーネント - LCP最適化用
 * CoveredImageと異なり、重い処理（fetchBinary, EXIF読み取り等）を行わない
 * 直接画像URLを指定し、ブラウザネイティブの読み込みに任せる
 */
export const SimpleImage = ({ src, alt, priority = false, className = "", width, height }: Props) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className || "w-full h-full object-cover"}
    />
  );
};
