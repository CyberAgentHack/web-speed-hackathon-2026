import { ComponentPropsWithRef } from "react";
import { Link as RouterLink } from "react-router";

type Props = ComponentPropsWithRef<typeof RouterLink>;

export const Link = (props: Props) => {
  return <RouterLink {...props} />;
};
