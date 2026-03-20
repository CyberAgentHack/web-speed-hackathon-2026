import { AnchorHTMLAttributes, forwardRef } from "react";
import { To } from "react-router";
// import { Link as LinkReactRouter } from 'react-router-dom';
import { Link  as LinkReactRouter} from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  return <LinkReactRouter ref={ref} to={to} {...props} />;
});

Link.displayName = "Link";
