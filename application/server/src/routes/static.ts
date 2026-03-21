import { readFileSync } from "fs";
import path from "path";

import { Router } from "express";
import serveStatic from "serve-static";
import { col, Op, where } from "sequelize";

import { DirectMessageConversation, Post, User } from "@web-speed-hackathon-2026/server/src/models";
import {
  CLIENT_DIST_PATH,
  PUBLIC_PATH,
  UPLOAD_PATH,
} from "@web-speed-hackathon-2026/server/src/paths";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query";

export const staticRouter = Router();

/** HTML 埋め込み用: 説明文など巨大フィールドを除き、インラインスクリプトのパース時間を抑える */
function trimUserForClientPreload(u: unknown): Record<string, unknown> | null {
  if (u == null || typeof u !== "object") return null;
  const raw = u as Record<string, unknown>;
  const pi = raw["profileImage"];
  const profileImage =
    pi != null && typeof pi === "object"
      ? {
          alt: (pi as Record<string, unknown>)["alt"] ?? "",
          id: (pi as Record<string, unknown>)["id"],
        }
      : pi;
  return {
    id: raw["id"],
    name: raw["name"],
    profileImage,
    username: raw["username"],
  };
}

function trimPostForClientPreload(raw: Record<string, unknown>): Record<string, unknown> {
  const images = raw["images"];
  const trimmedImages = Array.isArray(images)
    ? images.map((im) => {
        const row = im as Record<string, unknown>;
        return { alt: row["alt"] ?? "", id: row["id"] };
      })
    : images;

  const movie = raw["movie"];
  const trimmedMovie =
    movie != null && typeof movie === "object"
      ? { id: (movie as Record<string, unknown>)["id"] }
      : movie;

  const sound = raw["sound"];
  const trimmedSound =
    sound != null && typeof sound === "object"
      ? { id: (sound as Record<string, unknown>)["id"] }
      : sound;

  return {
    createdAt: raw["createdAt"],
    id: raw["id"],
    images: trimmedImages,
    movie: trimmedMovie,
    sound: trimmedSound,
    text: raw["text"],
    user: trimUserForClientPreload(raw["user"]),
  };
}

/** 投稿詳細の LCP 候補（先頭画像 or 動画 GIF）を先読みして、JS 実行前から取得を開始する */
function buildPostDetailLcpPreloadTags(post: Record<string, unknown> | null): string {
  if (post == null) return "";
  const parts: string[] = [];
  const images = post["images"];
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0] as { id?: string } | undefined;
    if (first?.id != null && first.id !== "") {
      parts.push(
        `<link rel="preload" as="image" href="/images/${first.id}.jpg" fetchpriority="high">`,
      );
    }
  }
  const movie = post["movie"] as { id?: string } | null | undefined;
  if (movie != null && typeof movie === "object" && movie.id != null && movie.id !== "") {
    parts.push(
      `<link rel="preload" as="image" href="/movies/${movie.id}.gif" fetchpriority="high">`,
    );
  }
  return parts.join("");
}

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
      // ホーム: LCP/TBT のため、初期に必要な情報だけに絞る
      // （images/movie/sound を含めると preload JSON が巨大になり main.js の Script Evaluation が長くなりやすい）
      const posts = await Post.unscoped().findAll({
        limit: 30,
        attributes: ["id", "text", "createdAt"],
        order: [["id", "DESC"]],
        include: [
          {
            association: "user",
            attributes: { exclude: ["profileImageId"] },
            include: [{ association: "profileImage", attributes: ["id", "alt"] }],
            required: true,
          },
        ],
      });

      data["/api/v1/posts"] = posts.map((p) => p.toJSON());
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
        const post = await Post.findByPk(postId);
        data[`/api/v1/posts/${postId}`] =
          post != null ? trimPostForClientPreload(post.toJSON() as Record<string, unknown>) : null;
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
          const trimmed = messages.slice(Math.max(0, messages.length - 6)).map((m) => {
            if (m?.sender != null && typeof m.sender === "object") {
              // UI側で sender は message.sender.id だけ使う
              if ((m.sender as any).profileImage != null) {
                delete (m.sender as any).profileImage;
              }
              for (const k of Object.keys(m.sender)) {
                if (k !== "id") delete (m.sender as any)[k];
              }
            }
            return m;
          });

          return {
            ...json,
            // peer 表示に不要なフィールドを削る
            initiator:
              json.initiator != null && typeof json.initiator === "object"
                ? (() => {
                    for (const k of Object.keys(json.initiator as any)) {
                      if (!["id", "username", "name", "profileImage"].includes(k)) {
                        delete (json.initiator as any)[k];
                      }
                    }
                    return json.initiator;
                  })()
                : json.initiator,
            member:
              json.member != null && typeof json.member === "object"
                ? (() => {
                    for (const k of Object.keys(json.member as any)) {
                      if (!["id", "username", "name", "profileImage"].includes(k)) {
                        delete (json.member as any)[k];
                      }
                    }
                    return json.member;
                  })()
                : json.member,
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
            const trimmed = messages.slice(0, Math.min(messages.length, 12)).map((m) => {
              if (m?.sender != null && typeof m.sender === "object") {
                if ((m.sender as any).profileImage != null) {
                  delete (m.sender as any).profileImage;
                }
                for (const k of Object.keys(m.sender)) {
                  if (k !== "id") delete (m.sender as any)[k];
                }
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
    const postMatch = req.path.match(/^\/posts\/([^/]+)$/);
    const postKey = postMatch != null ? `/api/v1/posts/${postMatch[1]}` : null;
    const postPayload =
      postKey != null && postKey in preloadData ? (preloadData[postKey] as Record<string, unknown> | null) : null;
    const lcpPreload = postKey != null ? buildPostDetailLcpPreloadTags(postPayload) : "";
    const script = `<script>window.__PRELOAD_DATA__=${JSON.stringify(preloadData)};</script>`;
    let html = lcpPreload !== "" ? template.replace("<head>", `<head>${lcpPreload}`) : template;
    html = html.replace("</head>", `${script}</head>`);
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
