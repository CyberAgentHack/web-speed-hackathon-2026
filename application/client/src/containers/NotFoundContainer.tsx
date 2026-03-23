import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/foundation/PageTitle";
import { NotFoundPage } from "@web-speed-hackathon-2026/client/src/components/application/NotFoundPage";

export const NotFoundContainer = () => {
  return (
    <>
      <PageTitle title="ページが見つかりません - CaX" />
      <NotFoundPage />
    </>
  );
};
