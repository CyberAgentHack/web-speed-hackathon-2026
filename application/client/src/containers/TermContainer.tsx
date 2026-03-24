import { useEffect } from "react";

import { TermPage } from "@web-speed-hackathon-2026/client/src/components/term/TermPage";
import { setPageTitle } from "@web-speed-hackathon-2026/client/src/utils/set_page_title";

export const TermContainer = () => {
  useEffect(() => {
    setPageTitle("利用規約 - CaX");
  }, []);

  return <TermPage />;
};
