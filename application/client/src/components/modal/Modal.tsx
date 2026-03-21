import classNames from "classnames";
import { type ComponentPropsWithRef, useCallback, useEffect, useState } from "react";

interface Props extends ComponentPropsWithRef<"dialog"> {
  closedby?: "any" | "closerequest" | "none";
}

export const Modal = ({ className, children, ref: forwardedRef, closedby, ...props }: Props) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mergedRef = useCallback(
    (el: HTMLDialogElement | null) => {
      if (typeof forwardedRef === "function") {
        forwardedRef(el);
      } else if (forwardedRef) {
        forwardedRef.current = el;
      }
      if (el && closedby) {
        el.setAttribute("closedby", closedby);
      }
    },
    [forwardedRef, closedby],
  );

  return (
    <dialog
      ref={mergedRef}
      className={classNames(
        "backdrop:bg-cax-overlay/50 bg-cax-surface fixed inset-0 m-auto w-full max-w-[calc(min(var(--container-md),100%)-var(--spacing)*4)] rounded-lg p-4",
        className,
      )}
      {...props}
    >
      {mounted ? children : null}
    </dialog>
  );
};
