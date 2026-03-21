import fs from "node:fs";
import path from "node:path";

import bodyParser from "body-parser";
import compression from "compression";
import Express from "express";

import { Post } from "@web-speed-hackathon-2026/server/src/models";
import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { apiRouter } from "@web-speed-hackathon-2026/server/src/routes/api";
import { staticRouter } from "@web-speed-hackathon-2026/server/src/routes/static";
import { sessionMiddleware } from "@web-speed-hackathon-2026/server/src/session";

export const app = Express();

app.set("trust proxy", true);
app.use(compression());
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use("/api/v1", apiRouter);

// ホームページ向け: LCP画像のpreloadヒントを注入したHTMLを返す
app.get("/", async (_req, res, next) => {
  try {
    const indexPath = path.join(CLIENT_DIST_PATH, "index.html");
    if (!fs.existsSync(indexPath)) {
      return next();
    }
    let html = fs.readFileSync(indexPath, "utf-8");

    const posts = await Post.findAll({ limit: 10 });
    for (const p of posts) {
      const json = p.toJSON() as { images?: Array<{ id: string }> };
      if (json.images && json.images.length > 0) {
        const imageId = json.images[0]!.id;
        const preloadLink = `<link rel="preload" as="image" href="/api/v1/optimized-image/${imageId}?w=800&format=webp" fetchpriority="high">`;
        html = html.replace("</head>", `  ${preloadLink}\n  </head>`);
        break;
      }
    }

    res.type("html").send(html);
  } catch {
    next();
  }
});

app.use(staticRouter);
