import { useEffect } from "react";

import { TermPage } from "@web-speed-hackathon-2026/client/src/components/term/TermPage";

export const TermContainer = () => {
  useEffect(() => {
    document.title = "利用規約 - CaX";
  }, []);

  return <TermPage />;
};

export default TermContainer;
