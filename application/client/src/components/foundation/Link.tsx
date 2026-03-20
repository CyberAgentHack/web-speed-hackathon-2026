import { AnchorHTMLAttributes, forwardRef } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  return <a ref={ref} href={to} {...props} />;
});

Link.displayName = "Link";
