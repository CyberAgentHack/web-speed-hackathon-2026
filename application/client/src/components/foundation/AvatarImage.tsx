import { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "height" | "loading" | "src" | "width"> & {
  loading?: "eager" | "lazy";
  size: number;
  src: string;
};

export const AvatarImage = ({
  alt,
  className,
  loading = "lazy",
  size,
  src,
  ...rest
}: Props) => {
  return (
    <img
      alt={alt}
      className={`h-full w-full object-cover${className ? ` ${className}` : ""}`}
      decoding="async"
      height={size}
      loading={loading}
      src={src}
      width={size}
      {...rest}
    />
  );
};
