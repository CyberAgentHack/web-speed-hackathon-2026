import { AnchorHTMLAttributes, forwardRef } from "react";
import { useLocation } from "wouter";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  const [, navigate] = useLocation();

  return (
    <a
      ref={ref}
      href={to}
      {...props}
      onClick={(ev) => {
        props.onClick?.(ev);
        if (ev.defaultPrevented) {
          return;
        }
        if (ev.button !== 0 || ev.metaKey || ev.altKey || ev.ctrlKey || ev.shiftKey) {
          return;
        }
        if (props.target != null && props.target !== "_self") {
          return;
        }
        ev.preventDefault();
        navigate(to);
      }}
    />
  );
});

Link.displayName = "Link";
