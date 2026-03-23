import { useEffect } from "react";
import { Helmet } from "react-helmet";

import { TermPage } from "@web-speed-hackathon-2026/client/src/components/term/TermPage";

const TERMS_FONT_LINK_ID = "terms-font-stylesheet";

export const TermContainer = () => {
  // Rei no Are Mincho は利用規約のみ使用。グローバル CSS に含めず /terms でだけ読み込む
  useEffect(() => {
    if (document.getElementById(TERMS_FONT_LINK_ID)) {
      return;
    }
    const link = document.createElement("link");
    link.id = TERMS_FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = "/styles/terms-font.css";
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>利用規約 - CaX</title>
      </Helmet>
      <TermPage />
    </>
  );
};
