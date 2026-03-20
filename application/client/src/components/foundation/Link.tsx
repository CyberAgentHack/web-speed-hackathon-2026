import { AnchorHTMLAttributes, MouseEventHandler, forwardRef, useCallback } from "react";
import { To, useHref, useNavigate } from "react-router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: To;
};

export const Link = forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => {
  const navigate = useNavigate();
  const href = useHref(to);
  const onClick = props.onClick;
  const target = props.target;
  const handleClick = useCallback<MouseEventHandler<HTMLAnchorElement>>(
    (ev) => {
      onClick?.(ev);
      if (ev.defaultPrevented) {
        return;
      }
      if (ev.button !== 0 || target === "_blank") {
        return;
      }
      if (ev.metaKey || ev.altKey || ev.ctrlKey || ev.shiftKey) {
        return;
      }

      ev.preventDefault();
      navigate(to);
    },
    [navigate, onClick, target, to],
  );

  return <a ref={ref} href={href} {...props} onClick={handleClick} />;
});

Link.displayName = "Link";
