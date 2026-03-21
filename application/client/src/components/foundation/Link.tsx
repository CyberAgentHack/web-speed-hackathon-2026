import { AnchorHTMLAttributes, forwardRef, MouseEvent } from "react";
import { To, useHref, useNavigate } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, onClick, ...props }, ref) => {
  const href = useHref(to);
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };

  return <a ref={ref} href={href} onClick={handleClick} {...props} />;
});

Link.displayName = "Link";
