import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode, forwardRef, memo } from "react"; // memo を追加

interface Props extends ComponentPropsWithRef<"input"> {
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  containerClassName?: string;
}

// 全体を memo() で囲む
export const Input = memo(forwardRef<HTMLInputElement, Props>(
  ({ className, containerClassName, leftItem, rightItem, ...props }, ref) => {
    return (
      <div
        className={classNames(
          "border-cax-border focus-within:ring-cax-brand flex items-center gap-2 rounded-full border px-4 py-2 focus-within:ring-2 focus-within:ring-offset-2",
          containerClassName
        )}
      >
        {leftItem}
        <input
          ref={ref}
          className={classNames(
            "flex-1 bg-transparent placeholder-cax-text-subtle focus:outline-none disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {rightItem}
      </div>
    );
  }
));

Input.displayName = "Input";
