import { AnchorHTMLAttributes, forwardRef, MouseEvent, useCallback } from "react";
import { To, useHref, useNavigate } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, onClick, ...props }, ref) => {
  const href = useHref(to);
  const navigate = useNavigate();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return;
      }
      e.preventDefault();
      navigate(to);
    },
    [navigate, to, onClick],
  );

  return <a ref={ref} href={href} onClick={handleClick} {...props} />;
});

Link.displayName = "Link";
