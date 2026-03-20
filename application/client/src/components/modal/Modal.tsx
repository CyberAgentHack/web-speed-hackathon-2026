import classNames from "classnames";
import { ComponentPropsWithRef, forwardRef } from "react";

interface Props extends ComponentPropsWithRef<"dialog"> {}

export const Modal = forwardRef<HTMLDialogElement, Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <dialog
        ref={ref}
        className={classNames(
          "backdrop:bg-cax-overlay/50 bg-cax-surface fixed inset-0 m-auto w-full max-w-[calc(min(var(--container-md),100%)-var(--spacing)*4)] rounded-lg p-4",
          className,
        )}
        {...props}
      >
        {children}
      </dialog>
    );
  },
);

Modal.displayName = "Modal";
