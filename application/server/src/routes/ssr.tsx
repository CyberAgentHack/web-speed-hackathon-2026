import { readFileSync } from "fs";
import path from "path";

import { Request, Response, Router } from "express";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { User } from "@web-speed-hackathon-2026/server/src/models/User";

const htmlTemplate = readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");

export const ssrRouter = Router();

ssrRouter.use("{*path}", async (req: Request, res: Response) => {
  try {
    let userJson = "null";
    if (req.session.userId) {
      const user = await User.findByPk(req.session.userId, {
        include: [{ association: "profileImage" }],
      });
      if (user) {
        userJson = JSON.stringify(user.toJSON());
      }
    }

    const initialScript = `<script>window.__INITIAL_USER__=${userJson};</script>`;
    const html = htmlTemplate.replace('</head>', `${initialScript}</head>`);

    res.status(200).type("text/html").send(html);
  } catch (e) {
    console.error("SSR error:", e);
    res.status(200).type("text/html").send(htmlTemplate);
  }
});
