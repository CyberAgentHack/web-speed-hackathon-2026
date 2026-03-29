import classNames from "classnames";
import { ComponentPropsWithRef, ReactNode } from "react";

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
  ...props
}: Props) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const command = (props as Record<string, unknown>)["command"] as string | undefined;
    const commandfor = (props as Record<string, unknown>)["commandfor"] as string | undefined;
    if (commandfor) {
      const el = document.getElementById(commandfor) as HTMLDialogElement | null;
      if (el) {
        if (command === "show-modal" && !el.open) el.showModal();
        else if (command === "close" && el.open) el.close();
      }
    }
    onClick?.(e);
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
