import type { Writable } from "node:stream";

import { renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { StaticRouter } from "react-router";

import { AppContainer } from "@web-speed-hackathon-2026/client/src/containers/AppContainer";
import { store } from "@web-speed-hackathon-2026/client/src/store";

export function render(
  url: string,
  ssrData: Record<string, unknown[]>,
  onShellReady: (pipe: (dest: Writable) => void) => void,
  onError: (err: unknown) => void,
): void {
  (globalThis as any).__SSR_DATA__ = ssrData;

  const { pipe } = renderToPipeableStream(
    <Provider store={store}>
      <StaticRouter location={url}>
        <AppContainer />
      </StaticRouter>
    </Provider>,
    {
      onShellReady() {
        delete (globalThis as any).__SSR_DATA__;
        onShellReady(pipe);
      },
      onError(err) {
        delete (globalThis as any).__SSR_DATA__;
        onError(err);
      },
    },
  );
}
