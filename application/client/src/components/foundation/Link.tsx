import { AnchorHTMLAttributes, forwardRef } from "react";
import { To, useHref, useNavigate } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, onClick, ...props }, ref) => {
  const href = useHref(to);
  const navigate = useNavigate();
  return (
    <a
      ref={ref}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        navigate(to);
      }}
      {...props}
    />
  );
});

Link.displayName = "Link";
