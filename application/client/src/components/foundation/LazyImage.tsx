import classNames from "classnames";
import { ComponentPropsWithoutRef, useMemo } from "react";

import { useInView } from "@web-speed-hackathon-2026/client/src/hooks/use_in_view";

interface Props extends ComponentPropsWithoutRef<"img"> {
  rootMargin?: string;
}

export const LazyImage = ({ rootMargin = "0px", src, className, ...props }: Props) => {
  const { ref, isInView } = useInView<HTMLImageElement>(rootMargin);
  const resolvedSrc = useMemo(() => {
    return isInView ? src : undefined;
  }, [isInView, src]);

  return (
    <img
      {...props}
      ref={ref}
      src={resolvedSrc}
      className={classNames("block", className)}
      loading="lazy"
      decoding="async"
    />
  );
};
