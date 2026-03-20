import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);

const apiCache = new Map<string, { body: any; headers: any; time: number }>();
const CACHE_TTL = 5000; // 5秒

app.use(compression({
  filter: (req, res) => {
    const type = res.getHeader("Content-Type");
    if (typeof type === "string" && /image|video|audio|wasm|vnd\.openxmlformats-officedocument/.test(type)) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "100mb" }));

// サーバーサイドキャッシュの実装
app.use("/api/v1", (req, res, next) => {
  // 初期化リクエスト時はキャッシュをクリア
  if (req.path === "/initialize" || req.method !== "GET") {
    apiCache.clear();
  }

  if (req.method === "GET") {
    const cached = apiCache.get(req.originalUrl);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      Object.entries(cached.headers).forEach(([k, v]) => res.setHeader(k, v as string));
      res.setHeader("X-Cache", "HIT");
      return res.send(cached.body);
    }

    const originalSend = res.send.bind(res);
    res.send = (body) => {
      // 200 OK のときのみキャッシュする
      if (res.statusCode === 200) {
        apiCache.set(req.originalUrl, {
          body,
          headers: res.getHeaders(),
          time: Date.now()
        });
      }
      return originalSend(body);
    };
  }

  res.setHeader("Cache-Control", "no-store");
  return next();
});

app.use("/api/v1", apiRouter);
app.use(staticRouter);
