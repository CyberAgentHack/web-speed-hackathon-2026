import { forwardRef } from "react";
import { Link as RouterLink, LinkProps } from "react-router";

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ ...props }, ref) => {
  return <RouterLink ref={ref} {...props} />;
});

Link.displayName = "Link";
