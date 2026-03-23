import { ComponentPropsWithRef, ReactNode } from "react";

import { runDialogCommand } from "@web-speed-hackathon-2026/client/src/utils/dialog";

interface Props extends ComponentPropsWithRef<"button"> {
  variant?: "primary" | "secondary";
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

export const Button = ({
  variant = "primary",
  leftItem,
  rightItem,
  className,
  children,
  onClick,
  command,
  commandfor,
  ...props
}: Props) => {
  const variantClassName =
    variant === "primary"
      ? "bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong border-transparent"
      : "bg-cax-surface text-cax-text-muted hover:bg-cax-surface-subtle border-cax-border";
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName} ${className ?? ""}`}
      type="button"
      command={command}
      commandfor={commandfor}
      onClick={(ev) => {
        onClick?.(ev);
        if (!ev.defaultPrevented) {
          runDialogCommand(command, commandfor);
        }
      }}
      {...props}
    >
      {leftItem}
      <span>{children}</span>
      {rightItem}
    </button>
  );
};
