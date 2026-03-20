import { useEffect } from "react";

import { NotFoundPage } from "@web-speed-hackathon-2026/client/src/components/application/NotFoundPage";
import { setPageTitle } from "@web-speed-hackathon-2026/client/src/utils/set_page_title";

export const NotFoundContainer = () => {
  useEffect(() => {
    setPageTitle("ページが見つかりません - CaX");
  }, []);

  return <NotFoundPage />;
};
