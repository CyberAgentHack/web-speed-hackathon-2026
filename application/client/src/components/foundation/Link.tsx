import { forwardRef } from "react";
import { Link as RouterLink, LinkProps } from "react-router";

type Props = Omit<LinkProps, "to"> & {
  to: LinkProps["to"];
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  return <RouterLink ref={ref} to={to} {...props} />;
});

Link.displayName = "Link";
