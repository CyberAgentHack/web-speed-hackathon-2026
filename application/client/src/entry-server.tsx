import { renderToReadableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";
import { combineReducers, legacy_createStore as createStore } from "redux";
import { reducer as formReducer } from "redux-form";
import { SWRConfig } from "swr";

import { clearSSRData, setSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import {
  AppContainer,
  type SSRData,
} from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { Document } from "@web-speed-hackathon-2026/client/src/Document";

export type { SSRData };

export interface RenderOptions {
  url: string;
  ssrData: SSRData;
  bootstrapModules: string[];
  cssHref: string;
}

function computeTitle(url: string, ssrData: SSRData): string | undefined {
  const pathname = new URL(url, "http://localhost").pathname;
  if (pathname === "/") return "タイムライン - CaX";
  if (pathname === "/search") return "検索 - CaX";
  if (pathname === "/terms") return "利用規約 - CaX";
  if (pathname === "/dm") return "ダイレクトメッセージ - CaX";
  if (pathname.startsWith("/dm/")) return "ダイレクトメッセージ - CaX";
  if (pathname === "/crok") return "Crok - CaX";
  if (pathname.startsWith("/posts/")) {
    const post = ssrData.post as Models.Post | null | undefined;
    if (post?.user?.name) return `${post.user.name} さんのつぶやき - CaX`;
  }
  if (pathname.startsWith("/users/")) {
    const user = ssrData.user as Models.User | null | undefined;
    if (user?.name) return `${user.name} さんのタイムライン - CaX`;
  }
  return undefined;
}

export async function render(options: RenderOptions): Promise<ReadableStream> {
  const { url, ssrData, bootstrapModules, cssHref } = options;
  setSSRData(ssrData);
  const store = createStore(combineReducers({ form: formReducer }));
  const title = computeTitle(url, ssrData);

  const bootstrapScriptContent = `window.__SSR_DATA__=${JSON.stringify(ssrData).replace(/</g, "\\u003c")};window.__CSS_HREF__=${JSON.stringify(cssHref)}`;

  const stream = await renderToReadableStream(
    <Provider store={store}>
      <SWRConfig value={swrConfig}>
        <StaticRouter location={url}>
          <Document cssHref={cssHref} title={title}>
            <AppContainer />
          </Document>
        </StaticRouter>
      </SWRConfig>
    </Provider>,
    {
      bootstrapModules,
      bootstrapScriptContent,
      onError(error: unknown) {
        console.error("SSR render error:", error);
      },
    },
  );
  await stream.allReady;
  clearSSRData();
  return stream;
}
