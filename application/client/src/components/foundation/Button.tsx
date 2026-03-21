import classNames from "classnames";
import { ComponentPropsWithRef, forwardRef, ReactNode } from "react";

interface Props extends ComponentPropsWithRef<"button"> {
  variant?: "primary" | "secondary";
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", leftItem, rightItem, className, children, onClick, ...props }, ref) => {
    const handleClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
      if (props.commandfor) {
        const dialog = document.getElementById(props.commandfor) as HTMLDialogElement | null;
        if (dialog && typeof dialog.showModal === "function") {
          if (props.command === "show-modal") {
            if (!dialog.open) {
              try {
                dialog.showModal();
              } catch (err) {
                console.error("Failed to open dialog:", err);
              }
            }
          } else if (props.command === "close") {
            dialog.close();
          }
        }
      }
      onClick?.(ev);
    };

    return (
      <button
        ref={ref}
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
        {...props}
        onClick={handleClick}
      >
        {leftItem}
        <span>{children}</span>
        {rightItem}
      </button>
    );
  },
);

Button.displayName = "Button";
