import { useEffect } from "react";

import { NotFoundPage } from "@web-speed-hackathon-2026/client/src/components/application/NotFoundPage";

export const NotFoundContainer = () => {
  useEffect(() => {
    document.title = "ページが見つかりません - CaX";
  }, []);
  return <NotFoundPage />;
};
