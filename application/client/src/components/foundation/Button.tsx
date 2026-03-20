import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode } from "react";

import { runDialogCommand } from "@web-speed-hackathon-2026/client/src/utils/dialog_commands";

interface Props extends ComponentPropsWithRef<"button"> {
  variant?: "primary" | "secondary";
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

export const Button = ({
  variant = "primary",
  leftItem,
  rightItem,
  onClick,
  className,
  children,
  ...props
}: Props) => {
  return (
    <button
      className={classNames(
        "flex items-center justify-center gap-2 rounded-full px-4 py-2 border",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong border-transparent":
            variant === "primary",
          "bg-cax-surface text-cax-text-muted hover:bg-cax-surface-subtle border-cax-border":
            variant === "secondary",
        },
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        runDialogCommand(props.command, props.commandfor);
      }}
      type="button"
      {...props}
    >
      {leftItem}
      <span>{children}</span>
      {rightItem}
    </button>
  );
};
