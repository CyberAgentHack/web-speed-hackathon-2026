import { ImgHTMLAttributes } from "react";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
}

export const LazyImage = ({ src, ...props }: Props) => {
  return (
    <img
      {...props}
      decoding={props.decoding ?? "async"}
      loading={props.loading ?? "lazy"}
      src={src}
    />
  );
};
