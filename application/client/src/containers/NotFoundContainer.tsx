import { NotFoundPage } from "@web-speed-hackathon-2026/client/src/components/application/NotFoundPage";
import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";

export const NotFoundContainer = () => {
  useDocumentTitle("ページが見つかりません - CaX");
  return <NotFoundPage />;
};
