import { readFileSync } from "fs";
import path from "path";

import { Router } from "express";
import serveStatic from "serve-static";
import { col, Op, where } from "sequelize";

import { Comment, DirectMessageConversation, Post, User } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query";

export const staticRouter = Router();

// index.html テンプレートをキャッシュ
let _htmlTemplate: string | null = null;
function getHtmlTemplate(): string {
  if (_htmlTemplate === null) {
    try {
      _htmlTemplate = readFileSync(path.join(CLIENT_DIST_PATH, "index.html"), "utf-8");
    } catch {
      _htmlTemplate = "";
    }
  }
  return _htmlTemplate;
}

// ルートに応じて必要な API データを事前取得する
async function buildPreloadData(req: Parameters<Parameters<typeof Router>[0]>[0]): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  // /api/v1/me の事前取得（認証状態に関わらず常に注入）
  try {
    if (req.session?.userId) {
      const user = await User.findByPk(req.session.userId);
      data["/api/v1/me"] = user ? user.toJSON() : null;
    } else {
      data["/api/v1/me"] = null;
    }
  } catch {
    data["/api/v1/me"] = null;
  }

  // ページ種別に応じたコンテンツの事前取得
  const urlPath = req.path;
  try {
    if (urlPath === "/" || urlPath === "") {
      // ホーム: タイムライン最初の件数を絞り、初期レンダリングに不要な重い関連を削って軽量化
      // （TBT の Long Task が main.js 側に寄っているため、preload JSON のパース/描画負荷を下げる）
      const posts = await Post.findAll({ limit: 12 });
      data["/api/v1/posts"] = posts.map((p) => {
        const json = p.toJSON() as Record<string, unknown> & {
          images?: unknown;
          movie?: unknown;
          sound?: unknown;
        };

        // TimelineItem は images/movie/sound が無い場合描画しないため、TBT軽量化のため落とす
        delete json.images;
        delete json.movie;
        delete json.sound;

        return json;
      });
    } else if (urlPath === "/search") {
      // 検索: 初期クエリに対する最初の 30 件
      const q = typeof req.query?.["q"] === "string" ? req.query["q"] : "";
      if (q.trim() !== "") {
        const { keywords, sinceDate, untilDate } = parseSearchQuery(q);
        const searchTerm = keywords ? `%${keywords}%` : null;
        const limit = 30;
        const offset = 0;

        const dateConditions: Record<symbol, Date>[] = [];
        if (sinceDate) {
          dateConditions.push({ [Op.gte]: sinceDate });
        }
        if (untilDate) {
          dateConditions.push({ [Op.lte]: untilDate });
        }
        const dateWhere =
          dateConditions.length > 0 ? { createdAt: Object.assign({}, ...dateConditions) } : {};

        const textWhere = searchTerm ? { text: { [Op.like]: searchTerm } } : {};

        const postsByText = await Post.findAll({
          limit,
          offset,
          where: {
            ...textWhere,
            ...dateWhere,
          },
        });

        let postsByUser: typeof postsByText = [];
        if (searchTerm) {
          postsByUser = await Post.findAll({
            include: [
              {
                // ユーザー名/名前での検索（キーワードがある場合のみ）
                association: "user",
                attributes: { exclude: ["profileImageId"] },
                include: [{ association: "profileImage" }],
                required: true,
                where: {
                  [Op.or]: [{ username: { [Op.like]: searchTerm } }, { name: { [Op.like]: searchTerm } }],
                },
              },
              { association: "images", through: { attributes: [] } },
              { association: "movie" },
              { association: "sound" },
            ],
            limit,
            offset,
            where: dateWhere,
          });
        }

        const postIdSet = new Set<string>();
        const mergedPosts: typeof postsByText = [];
        for (const post of [...postsByText, ...postsByUser]) {
          if (!postIdSet.has(post.id)) {
            postIdSet.add(post.id);
            mergedPosts.push(post);
          }
        }
        mergedPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const result = mergedPosts.slice(offset, offset + limit);
        const apiKey = `/api/v1/search?q=${encodeURIComponent(q)}`;
        data[apiKey] = result;
      }
    } else {
      const postMatch = urlPath.match(/^\/posts\/([^/]+)$/);
      if (postMatch) {
        // 投稿詳細ページ
        const postId = postMatch[1];
        const [post, comments] = await Promise.all([
          Post.findByPk(postId),
          Comment.findAll({ where: { postId }, limit: 30 }),
        ]);
        data[`/api/v1/posts/${postId}`] = post ? post.toJSON() : null;
        data[`/api/v1/posts/${postId}/comments`] = comments.map((c) => c.toJSON());
      }
    }

    // DM 一覧/詳細は /dm 配下の SPA ルートとして扱う
    if (req.session?.userId != null) {
      if (urlPath === "/dm") {
        const conversations = await DirectMessageConversation.findAll({
          where: {
            [Op.and]: [
              { [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }] },
              where(col("messages.id"), { [Op.not]: null }),
            ],
          },
          order: [[col("messages.createdAt"), "DESC"]],
        });

        data["/api/v1/dm"] = conversations.map((c) => {
          const json = c.toJSON() as Record<string, unknown> & { messages?: any[] };
          const messages = json.messages?.reverse() ?? [];

          // LCP に影響する lastMessage と、unread 判定に必要な最小限を残す
          const trimmed = messages.slice(Math.max(0, messages.length - 8)).map((m) => {
            if (m?.sender?.profileImage != null) {
              // UI側で sender.profileImage は不要なので削って JSON サイズを圧縮
              delete m.sender.profileImage;
            }
            return m;
          });

          return {
            ...json,
            messages: trimmed,
          };
        });
      } else {
        const dmMatch = urlPath.match(/^\/dm\/([^/]+)$/);
        if (dmMatch) {
          const conversationId = dmMatch[1];
          const conversation = await DirectMessageConversation.findOne({
            where: {
              id: conversationId,
              [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
            },
          });
          if (conversation) {
            const json = conversation.toJSON() as Record<string, unknown> & { messages?: any[] };
            const messages = json.messages ?? [];
            // 本文として上側に来るメッセージがLCP候補になりやすいので、前後を少しだけ残す
            const trimmed = messages.slice(0, Math.min(messages.length, 30)).map((m) => {
              if (m?.sender?.profileImage != null) {
                delete m.sender.profileImage;
              }
              return m;
            });
            data[`/api/v1/dm/${conversationId}`] = {
              ...json,
              messages: trimmed,
            };
          } else {
            data[`/api/v1/dm/${conversationId}`] = null;
          }
        }
      }
    }
  } catch {
    // データ取得に失敗してもページは表示する
  }

  return data;
}

// SPA ルート（拡張子なし）を処理: データ注入済みの HTML を返す
staticRouter.use(async (req, res, next) => {
  if (req.method !== "GET" || path.extname(req.path) !== "") {
    return next();
  }

  const template = getHtmlTemplate();
  if (!template) return next();

  try {
    const preloadData = await buildPreloadData(req);
    const script = `<script>window.__PRELOAD_DATA__=${JSON.stringify(preloadData)};</script>`;
    const html = template.replace("</head>", `${script}</head>`);
    return res.type("text/html").send(html);
  } catch {
    return next();
  }
});

staticRouter.use(
  serveStatic(UPLOAD_PATH, {
    etag: false,
    lastModified: false,
  }),
);

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
