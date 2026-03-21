import { forwardRef } from "react";
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router";

type Props = RouterLinkProps;

export const Link = forwardRef<HTMLAnchorElement, Props>((props, ref) => {
  return <RouterLink ref={ref} {...props} />;
});

Link.displayName = "Link";
