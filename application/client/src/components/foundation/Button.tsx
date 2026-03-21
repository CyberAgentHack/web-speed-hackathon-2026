import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode } from "react";

import { runDialogCommand } from "@web-speed-hackathon-2026/client/src/utils/dialog_command";

interface Props extends Omit<ComponentPropsWithRef<"button">, "command" | "commandfor"> {
  variant?: "primary" | "secondary";
  leftItem?: ReactNode;
  rightItem?: ReactNode;
  command?: string;
  commandfor?: string;
}

export const Button = ({
  variant = "primary",
  leftItem,
  rightItem,
  command,
  commandfor,
  onClick,
  className,
  children,
  ...props
}: Props) => {
  const handleClick: ComponentPropsWithRef<"button">["onClick"] = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    runDialogCommand(command, commandfor);
  };

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
      type="button"
      onClick={handleClick}
      {...props}
    >
      {leftItem}
      <span>{children}</span>
      {rightItem}
    </button>
  );
};
