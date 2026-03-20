import { GetObjectCommand } from "@aws-sdk/client-s3";
import history from "connect-history-api-fallback";
import { Router } from "express";
import serveStatic from "serve-static";

import { CLIENT_DIST_PATH, PUBLIC_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { s3Client, MINIO_BUCKET } from "@web-speed-hackathon-2026/server/src/utils/s3";

export const staticRouter = Router();

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

// Proxy requests for uploaded files directly from MinIO
staticRouter.get(/^\/(images|movies|sounds)\/(.+)/, async (req, res, next) => {
  try {
    const typeDir = req.params[0];
    const filename = req.params[1];
    const key = `${typeDir}/${filename}`;

    const command = new GetObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
    });
    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      return next();
    }

    if (s3Response.ContentType) {
      res.setHeader("Content-Type", s3Response.ContentType);
    }
    if (s3Response.ContentLength) {
      res.setHeader("Content-Length", s3Response.ContentLength);
    }
    if (s3Response.ETag) {
      res.setHeader("ETag", s3Response.ETag);
    }

    // Body is a Readable stream in Node.js
    (s3Response.Body as any).pipe(res);
  } catch (err: any) {
    if (err.name === "NoSuchKey") {
      return next();
    }
    next(err);
  }
});

staticRouter.use(
  serveStatic(PUBLIC_PATH, {
    etag: false,
    lastModified: false,
  }),
);

staticRouter.use(
  serveStatic(CLIENT_DIST_PATH, {
    etag: false,
    lastModified: false,
  }),
);
