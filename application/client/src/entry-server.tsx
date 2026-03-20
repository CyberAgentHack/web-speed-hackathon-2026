import { renderToReadableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";
import { combineReducers, legacy_createStore as createStore } from "redux";
import { reducer as formReducer } from "redux-form";
import { SWRConfig } from "swr";

import { buildSWRFallback } from "@web-speed-hackathon-2026/client/src/api/ssr-fallback";
import {
  clearSSRData,
  getSSRData,
  setSSRData,
} from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { swrConfig } from "@web-speed-hackathon-2026/client/src/api/swr";
import {
  AppContainer,
  type SSRData,
} from "@web-speed-hackathon-2026/client/src/containers/AppContainer";

export type { SSRData };

export async function render(url: string, ssrData: SSRData): Promise<ReadableStream> {
  setSSRData(ssrData);
  console.log("SSR render: setSSRData done, posts count:", (ssrData as any)?.posts?.length);
  console.log("SSR render: getSSRData check:", getSSRData()?.posts?.length);
  const store = createStore(combineReducers({ form: formReducer }));
  const fallback = buildSWRFallback(url, ssrData);
  console.log("SSR render: fallback keys:", Object.keys(fallback));

  const stream = await renderToReadableStream(
    <Provider store={store}>
      <SWRConfig value={{ ...swrConfig, fallback }}>
        <StaticRouter location={url}>
          <AppContainer />
        </StaticRouter>
      </SWRConfig>
    </Provider>,
    {
      onError(error: unknown) {
        console.error("SSR renderToReadableStream error:", error);
      },
    },
  );
  await stream.allReady;
  clearSSRData();
  return stream;
}
