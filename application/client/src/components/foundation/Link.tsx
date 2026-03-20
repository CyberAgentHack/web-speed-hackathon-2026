import { AnchorHTMLAttributes } from "react";
import { To, useHref } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
  ref: React.Ref<HTMLAnchorElement>;
};

export function Link({ to, ref, ...props }: Props) {
  const href = useHref(to);
  return <a ref={ref} href={href} {...props} />;
}
