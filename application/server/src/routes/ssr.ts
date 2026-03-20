import fs from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";

import { Hono } from "hono";

import { CLIENT_DIST_PATH, SSR_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import type { SessionEnv } from "@web-speed-hackathon-2026/server/src/session";
import { getServerData } from "@web-speed-hackathon-2026/server/src/ssr/getServerData";

// Production で使う index.html テンプレートを起動時に読み込み
let templateHtml = "";
try {
  templateHtml = fs.readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");
} catch {
  console.warn("SSR: index.html not found in dist, SSR will be disabled");
}

// SSR バンドルの読み込み
type RenderFn = (url: string, ssrData: any, opts?: any) => { pipe: (dest: any) => any };
let ssrRender: RenderFn | null = null;
try {
  const ssrModule = await import(path.resolve(SSR_DIST_PATH, "entry-server.js"));
  ssrRender = ssrModule.render;
} catch {
  console.warn("SSR: entry-server.js not found in dist-ssr, SSR will be disabled");
}

function csrFallbackHtml(): string {
  return templateHtml.replace("<!--ssr-outlet-->", "").replace("<!--ssr-head-->", "");
}

export const ssrRouter = new Hono<SessionEnv>();

ssrRouter.get("*", async (c) => {
  if (c.req.path.startsWith("/api") || /\.\w+$/.test(c.req.path)) {
    return c.notFound();
  }

  if (!templateHtml || !ssrRender) {
    c.header("Cache-Control", "no-cache");
    return c.html(csrFallbackHtml());
  }

  try {
    const session = c.get("session");
    const userId = session.get()?.userId;
    const ssrData = await getServerData(c.req.path, userId);

    if (ssrData === null) {
      c.header("Cache-Control", "no-cache");
      return c.html(csrFallbackHtml());
    }

    const [beforeOutlet, afterOutlet] = templateHtml.split("<!--ssr-outlet-->");
    const ssrDataScript = `<script>window.__SSR_DATA__=${JSON.stringify(ssrData).replace(/</g, "\\u003c")}</script>`;
    const afterWithHead = afterOutlet!.replace("<!--ssr-head-->", ssrDataScript);

    // React の renderToPipeableStream → Node.js Transform → Web ReadableStream
    const nodeStream = await new Promise<Readable>((resolve) => {
      let didError = false;

      const appendStream = new Transform({
        transform(chunk, _encoding, callback) {
          callback(null, chunk);
        },
        flush(callback) {
          this.push(afterWithHead);
          callback();
        },
      });

      const { pipe } = ssrRender!(c.req.path, ssrData, {
        onShellReady() {
          if (didError) return;
          appendStream.unshift(Buffer.from(beforeOutlet!));
          pipe(appendStream);
          resolve(appendStream);
        },
        onShellError() {
          didError = true;
          resolve(Readable.from(csrFallbackHtml()));
        },
        onError(error: unknown) {
          didError = true;
          console.error("SSR render error:", error);
        },
      });
    });

    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", "no-cache");
    return c.body(webStream);
  } catch (error) {
    console.error("SSR handler error:", error);
    c.header("Cache-Control", "no-cache");
    return c.html(csrFallbackHtml());
  }
});
