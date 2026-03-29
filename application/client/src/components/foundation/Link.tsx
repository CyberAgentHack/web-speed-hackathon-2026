import type { AnchorHTMLAttributes} from "react";
import { forwardRef } from "react";
import type { To } from "react-router";
import { useHref } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  const href = useHref(to);
  return <a ref={ref} href={href} {...props} />;
});

Link.displayName = "Link";
