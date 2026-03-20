import { type To, Link as RrLink } from "react-router";

type Props = {
  to: To;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export const Link = ({ to, ...props }: Props) => {
  return <RrLink to={to} {...props} />;
};
