import { readFile } from "node:fs/promises";
import path from "path";

import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import { Op } from "sequelize";

import { DirectMessageConversation, Post, User } from "@web-speed-hackathon-2026/server/src/models";
import { getSession } from "@web-speed-hackathon-2026/server/src/session";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";

export const staticApp = new Hono();

// Convert absolute paths to relative paths (required by serveStatic)
const uploadRoot = path.relative(process.cwd(), UPLOAD_PATH);
const publicRoot = path.relative(process.cwd(), PUBLIC_PATH);
const distRoot = path.relative(process.cwd(), CLIENT_DIST_PATH);

// Serve uploaded files (images, movies, sounds)
staticApp.use(
  "*",
  serveStatic({
    root: uploadRoot,
    onFound: (_path, c) => {
      c.header("Cache-Control", "public, max-age=86400");
    },
  }),
);

// Serve public assets
staticApp.use(
  "*",
  serveStatic({
    root: publicRoot,
    onFound: (_path, c) => {
      c.header("Cache-Control", "public, max-age=86400");
    },
  }),
);

// Serve client dist (built JS/CSS/assets)
staticApp.use(
  "*",
  serveStatic({
    root: distRoot,
    onFound: (filePath, c) => {
      // Long-term cache for hashed files
      if (/\.[a-f0-9]{8,}\.(js|css|wasm|woff2?|ttf|otf)$/.test(filePath)) {
        c.header("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// Home page: inject initial posts data to eliminate API round-trip for LCP
const indexHtmlPath = path.join(CLIENT_DIST_PATH, "index.html");
staticApp.get("/", async (c) => {
  const [html, posts] = await Promise.all([
    readFile(indexHtmlPath, "utf8"),
    Post.findAll({ limit: 30, offset: 0 }),
  ]);
  const postsJson = JSON.stringify(posts.map((p) => p.toJSON()));
  const injected = html.replace(
    "</head>",
    `<script>window.__INITIAL_POSTS__=${postsJson}</script></head>`,
  );
  return c.html(injected, 200);
});

// Post detail page: inject post data + preload LCP image to eliminate API round-trip
staticApp.get("/posts/:postId", async (c) => {
  const postId = c.req.param("postId");
  const [html, post] = await Promise.all([
    readFile(indexHtmlPath, "utf8"),
    Post.findByPk(postId),
  ]);

  if (!post) {
    return c.html(html, 200);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postData = post.toJSON() as any;
  const postJson = JSON.stringify(postData);

  let preloadTag = "";
  if (postData.images?.length > 0) {
    preloadTag = `<link rel="preload" as="image" href="/images/${postData.images[0].id}.jpg">`;
  } else if (postData.movie) {
    preloadTag = `<link rel="preload" as="image" href="/movies/${postData.movie.id}.gif">`;
  }

  const injected = html.replace(
    "</head>",
    `${preloadTag}<script>window.__INITIAL_POST__=${postJson}</script></head>`,
  );
  return c.html(injected, 200);
});

// DM detail page: inject user + conversation data + preload peer profile image
staticApp.get("/dm/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");
  const html = await readFile(indexHtmlPath, "utf8");

  const userId = getSession(c);
  if (!userId) return c.html(html, 200);

  const [user, conversation] = await Promise.all([
    User.findByPk(userId),
    DirectMessageConversation.findOne({
      where: { id: conversationId, [Op.or]: [{ initiatorId: userId }, { memberId: userId }] },
      include: [
        { association: "initiator", include: [{ association: "profileImage" }] },
        { association: "member", include: [{ association: "profileImage" }] },
        {
          association: "messages",
          include: [{ association: "sender", include: [{ association: "profileImage" }] }],
          order: [["createdAt", "ASC"]],
          separate: true,
        },
      ],
    }),
  ]);

  if (!user || !conversation) return c.html(html, 200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convData = conversation.toJSON() as any;
  const peer = convData.initiatorId !== userId ? convData.initiator : convData.member;
  const preloadTag = peer
    ? `<link rel="preload" as="image" href="/images/profiles/${peer.profileImage.id}.jpg">`
    : "";

  const injected = html.replace(
    "</head>",
    `${preloadTag}<script>window.__INITIAL_ME__=${JSON.stringify(user.toJSON())};window.__INITIAL_DM_CONVERSATION__=${JSON.stringify(convData)}</script></head>`,
  );
  return c.html(injected, 200);
});

// SPA fallback: serve index.html for all non-file routes
staticApp.use("*", serveStatic({ path: "index.html", root: distRoot }));
