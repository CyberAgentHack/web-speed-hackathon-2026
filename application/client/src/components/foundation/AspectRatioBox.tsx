import { ComponentProps, ReactNode } from "react";

import classNames from "classnames";

interface Props extends Omit<ComponentProps<"div">, "children"> {
  aspectRatio: `${number} / ${number}`;
  children: ReactNode;
}

export const AspectRatioBox = ({ aspectRatio, children, className, style, ...props }: Props) => {
  return (
    <div
      {...props}
      className={classNames("w-full", className)}
      style={{ ...style, aspectRatio }}
    >
      {children}
    </div>
  );
};
