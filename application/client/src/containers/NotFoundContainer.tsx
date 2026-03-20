import { Helmet } from "react-helmet";

import { NotFoundPage } from "@web-speed-hackathon-2026/client/src/components/application/NotFoundPage";

const NotFoundContainer = () => {
  return (
    <>
      <Helmet>
        <title>ページが見つかりません - CaX</title>
      </Helmet>
      <NotFoundPage />
    </>
  );
};
export default NotFoundContainer;
