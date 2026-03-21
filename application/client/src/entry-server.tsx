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

export async function render(options: RenderOptions): Promise<ReadableStream> {
  const { url, ssrData, bootstrapModules, cssHref } = options;
  setSSRData(ssrData);
  const store = createStore(combineReducers({ form: formReducer }));

  const bootstrapScriptContent = `window.__SSR_DATA__=${JSON.stringify(ssrData).replace(/</g, "\\u003c")};window.__CSS_HREF__=${JSON.stringify(cssHref)}`;

  const stream = await renderToReadableStream(
    <Provider store={store}>
      <SWRConfig value={swrConfig}>
        <StaticRouter location={url}>
          <Document cssHref={cssHref}>
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
