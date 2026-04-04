import classNames from "classnames";
import { ComponentPropsWithRef, MouseEventHandler, ReactNode, useCallback } from "react";

import { closeDialog, showDialog } from "@web-speed-hackathon-2026/client/src/utils/dialog";

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
  command,
  commandfor,
  onClick,
  ...props
}: Props) => {
  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (event) => {
      onClick?.(event);
      if (event.defaultPrevented || typeof commandfor !== "string") {
        return;
      }

      if (command === "show-modal") {
        showDialog(commandfor);
      } else if (command === "close") {
        closeDialog(commandfor);
      }
    },
    [command, commandfor, onClick],
  );

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
      command={command}
      commandfor={commandfor}
      onClick={handleClick}
      type="button"
      {...props}
    >
      {leftItem}
      <span>{children}</span>
      {rightItem}
    </button>
  );
};
