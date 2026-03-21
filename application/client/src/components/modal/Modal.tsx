import { ComponentPropsWithRef } from "react";

import { classNames } from "@web-speed-hackathon-2026/client/src/utils/class_names";

interface Props extends ComponentPropsWithRef<"dialog"> {}

export const Modal = ({ className, children, ...props }: Props) => {
  return (
    <dialog
      className={classNames(
        "backdrop:bg-cax-overlay/50 bg-cax-surface fixed inset-0 m-auto w-full max-w-[calc(min(var(--container-md),100%)-var(--spacing)*4)] rounded-lg p-4",
        className,
      )}
      {...props}
    >
      {children}
    </dialog>
  );
};
