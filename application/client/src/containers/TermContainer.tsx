import { TermPage } from "@web-speed-hackathon-2026/client/src/components/term/TermPage";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";

export const TermContainer = () => {
  useTitle("利用規約 - CaX");

  return <TermPage />;
};
