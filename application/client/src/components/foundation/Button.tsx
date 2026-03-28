import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode, forwardRef } from "react";

interface Props extends ComponentPropsWithRef<"button"> {
  variant?: "primary" | "secondary";
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

// forwardRef を使って ref をボタン本体に渡せるようにする
export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      variant = "primary",
      leftItem,
      rightItem,
      className,
      children,
      type = "button", // デフォルト値を指定しつつ上書き可能にする
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={classNames(
          "flex items-center justify-center gap-2 rounded-full px-4 py-2 border transition-colors", // transitionを追加すると心地よい
          "disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong border-transparent":
              variant === "primary",
            "bg-cax-surface text-cax-text-muted hover:bg-cax-surface-subtle border-cax-border":
              variant === "secondary",
          },
          className,
        )}
        type={type}
        {...props}
      >
        {leftItem}
        {/* childrenがある場合のみ描画し、不要な余白を避ける */}
        {children && <span>{children}</span>}
        {rightItem}
      </button>
    );
  },
);

Button.displayName = "Button"; // forwardRef使用時はデバッグ用にdisplayNameを付けるのが定石
