import { AnchorHTMLAttributes, forwardRef } from "react";
import { Link as RRLink, To } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  // const href = useHref(to);
  return <RRLink ref={ref} to={to} {...props} />;
});

Link.displayName = "Link";
