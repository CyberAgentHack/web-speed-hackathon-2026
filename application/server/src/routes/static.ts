import history from "connect-history-api-fallback";
import path from "node:path";
import { Router } from "express";
import serveStatic from "serve-static";

import {
    CLIENT_DIST_PATH,
    PUBLIC_PATH,
    UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticRouter = Router();

const setRevalidatedCacheHeader = (res: {
    setHeader: (name: string, value: string) => void;
}) => {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
};

const setClientDistCacheHeader = (
    res: { setHeader: (name: string, value: string) => void },
    filePath: string,
) => {
    if (path.extname(filePath) === ".html") {
        setRevalidatedCacheHeader(res);
        return;
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
};

// SPA 対応のため、ファイルが存在しないときに index.html を返す
staticRouter.use(history());

staticRouter.use(
    serveStatic(UPLOAD_PATH, {
        setHeaders: setRevalidatedCacheHeader,
    }),
);

staticRouter.use(
    serveStatic(PUBLIC_PATH, {
        setHeaders: setRevalidatedCacheHeader,
    }),
);

staticRouter.use(
    serveStatic(CLIENT_DIST_PATH, {
        setHeaders: setClientDistCacheHeader,
    }),
);
