interface Props {
  src: string;
  alt?: string;
}

export const SimpleCoveredImage = ({ src, alt = "" }: Props) => {
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      decoding="async"
    />
  );
};
