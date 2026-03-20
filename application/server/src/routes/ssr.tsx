import { readFileSync } from "fs";
import path from "path";

import { Request, Response, Router } from "express";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";

const htmlTemplate = readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");

export const ssrRouter = Router();

ssrRouter.use("{*path}", (_req: Request, res: Response) => {
  res.status(200).type("text/html").send(htmlTemplate);
});
