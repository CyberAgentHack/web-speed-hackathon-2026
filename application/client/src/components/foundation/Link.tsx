import { AnchorHTMLAttributes, forwardRef } from "react";
import { Link as RouterLink, To } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  return <RouterLink ref={ref} to={to} {...props} />;
});

Link.displayName = "Link";
