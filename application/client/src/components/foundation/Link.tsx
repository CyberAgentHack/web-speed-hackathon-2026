import { Link as TrLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof TrLink>;

export const Link = ({ ...props }: Props) => {
  return <TrLink {...props} />;
};
