import { Link as RouterLink, To } from "react-router";
import { AnchorHTMLAttributes, forwardRef } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  return <RouterLink ref={ref} to={to} {...props} />;
});

Link.displayName = "Link";
