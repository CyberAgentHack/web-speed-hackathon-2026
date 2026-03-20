import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode } from "react";

interface Props extends ComponentPropsWithRef<"input"> {
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

export const Input = ({ className, leftItem, rightItem, ...props }: Props) => {
  return (
    <div className="border-cax-border focus-within:outline-cax-brand flex items-center gap-2 rounded-full border px-4 py-2 focus-within:outline-2 focus-within:outline-offset-2">
      {leftItem}
      <input
        className={classNames("flex-1 placeholder-cax-text-subtle focus:outline-none", className)}
        {...props}
      />
      {rightItem}
    </div>
  );
};
