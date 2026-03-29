import { NotFoundPage } from "@web-speed-hackathon-2026/client/src/components/application/NotFoundPage";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";

export const NotFoundContainer = () => {
  useTitle("ページが見つかりません - CaX");

  return <NotFoundPage />;
};
