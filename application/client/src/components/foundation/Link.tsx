import { forwardRef } from "react";
import { Link as RouterLink, type LinkProps } from "react-router";

type Props = LinkProps;

export const Link = forwardRef<HTMLAnchorElement, Props>((props, ref) => {
  return <RouterLink ref={ref} {...props} />;
});

Link.displayName = "Link";
