import fs from "node:fs";
import path from "node:path";
import { Transform } from "node:stream";

import { Request, Response, Router } from "express";

import { CLIENT_DIST_PATH, SSR_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
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

function sendCsrFallback(res: Response) {
  const html = templateHtml.replace("<!--ssr-outlet-->", "").replace("<!--ssr-head-->", "");
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
}

export const ssrRouter = Router();

ssrRouter.use(async (req: Request, res: Response, next) => {
  // API や静的ファイルリクエストはスキップ
  if (req.path.startsWith("/api") || req.path.match(/\.\w+$/)) {
    return next();
  }

  // SSR が利用不可の場合は fallback
  if (!templateHtml || !ssrRender) {
    return next();
  }

  try {
    const ssrData = await getServerData(req.originalUrl, req.session.userId);

    // SSR スキップ対象（DM, Crok 等）
    if (ssrData === null) {
      return sendCsrFallback(res);
    }

    // テンプレート分割
    const [beforeOutlet, afterOutlet] = templateHtml.split("<!--ssr-outlet-->");
    const ssrDataScript = `<script>window.__SSR_DATA__=${JSON.stringify(ssrData).replace(/</g, "\\u003c")}</script>`;
    const afterWithHead = afterOutlet!.replace("<!--ssr-head-->", ssrDataScript);

    // SSR HTML の後に残りの HTML を追記する Transform stream
    const appendStream = new Transform({
      transform(chunk, _encoding, callback) {
        callback(null, chunk);
      },
      flush(callback) {
        this.push(afterWithHead);
        callback();
      },
    });

    let didError = false;

    const { pipe } = ssrRender(req.originalUrl, ssrData, {
      onShellReady() {
        if (didError) return;
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "no-cache");
        res.write(beforeOutlet);
        pipe(appendStream);
        appendStream.pipe(res);
      },
      onShellError() {
        didError = true;
        sendCsrFallback(res);
      },
      onError(error: unknown) {
        didError = true;
        console.error("SSR render error:", error);
      },
    });
  } catch (error) {
    console.error("SSR handler error:", error);
    sendCsrFallback(res);
  }
});
