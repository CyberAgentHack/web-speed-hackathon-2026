import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";

interface SSRData {
  posts?: Models.Post[];
  user?: Models.User | null;
}

const SSR_RENDER_LIMIT = 10;

export function render(url: string, data: SSRData): { html: string; renderLimit: number } {
  const noop = () => {};
  const isHome = url === "/" || url === "/index.html";

  // 実際のクライアントコンポーネントでレンダリング → hydration完全一致
  const html = renderToString(
    <StaticRouter location={url}>
      <AppPage
        activeUser={data.user ?? null}
        authModalId=":ssr-auth:"
        newPostModalId=":ssr-newpost:"
        onLogout={noop}
      >
        {isHome && data.posts && data.posts.length > 0 ? (
          <TimelinePage timeline={data.posts.slice(0, SSR_RENDER_LIMIT)} />
        ) : null}
      </AppPage>
    </StaticRouter>,
  );

  return { html, renderLimit: SSR_RENDER_LIMIT };
}
