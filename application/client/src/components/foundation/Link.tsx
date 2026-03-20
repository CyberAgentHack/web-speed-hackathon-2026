import { forwardRef } from "react";
import { Link as RouterLink, type LinkProps } from "react-router";

type Props = LinkProps;

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
	return <RouterLink ref={ref} to={to} {...props} />;
});

Link.displayName = "Link";
