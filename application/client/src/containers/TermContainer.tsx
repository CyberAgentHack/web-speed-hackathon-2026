import { Helmet } from "react-helmet";

import { TermPage } from "@web-speed-hackathon-2026/client/src/components/term/TermPage";

const TermContainer = () => {
  return (
    <>
      <Helmet>
        <title>利用規約 - CaX</title>
      </Helmet>
      <TermPage />
    </>
  );
};
export default TermContainer;
