import { ComponentPropsWithoutRef, forwardRef } from "react";
import { Link as RouterLink } from "react-router";

type Props = ComponentPropsWithoutRef<typeof RouterLink>;

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  return <RouterLink ref={ref} to={to} {...props} />;
});

Link.displayName = "Link";
