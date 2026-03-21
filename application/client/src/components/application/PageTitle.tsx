import { ReactNode, useEffect } from "react";

type Props = {
  children: ReactNode;
};

export const PageTitle = ({ children }: Props) => {
  const title = Array.isArray(children) ? children.join("") : String(children);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return <title>{title}</title>;
};
