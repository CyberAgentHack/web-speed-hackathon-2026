import bodyParser from 'body-parser'
import compression from 'compression'
import Express from 'express'
import morgan from 'morgan'

import { apiRouter } from '@web-speed-hackathon-2026/server/src/routes/api'
import { imageResizeRouter } from '@web-speed-hackathon-2026/server/src/routes/image_resize'
import { staticRouter } from '@web-speed-hackathon-2026/server/src/routes/static'
import { sessionMiddleware } from '@web-speed-hackathon-2026/server/src/session'

export const app = Express();

app.set("trust proxy", true);

app.use((req, res, next) => {
  if (req.headers['user-agent']?.includes('Consul Health Check')) {
    res.status(200).send('OK');
    return;
  }
  next();
});

app.use(compression({
  filter: (req, res) => {
    const contentType = res.getHeader('Content-Type')?.toString() ?? '';
    if (contentType.startsWith('image/') || contentType.startsWith('video/') || contentType.startsWith('audio/')) return false;
    return compression.filter(req, res);
  }
}));

// const isDev = process.env["NODE_ENV"] === "development";
app.use(
  morgan("dev", {
    // skip: (_, res) => (isDev ? false : res.statusCode < 400),
  }),
);
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.raw({ limit: "10mb" }));

app.use("/api/v1", apiRouter);
app.use(imageResizeRouter);
app.use(staticRouter);
