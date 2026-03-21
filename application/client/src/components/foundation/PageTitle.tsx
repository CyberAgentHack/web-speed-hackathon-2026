import { useEffect } from "react";

interface Props {
  title: string;
}

export const PageTitle = ({ title }: Props) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
};
