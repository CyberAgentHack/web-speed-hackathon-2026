import { TermPage } from "@web-speed-hackathon-2026/client/src/components/term/TermPage";
import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";

export const TermContainer = () => {
  useDocumentTitle("利用規約 - CaX");
  return <TermPage />;
};
