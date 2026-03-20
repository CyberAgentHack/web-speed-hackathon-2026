import { readFile } from "fs/promises";
import path from "path";

import type { Request } from "express";
import { Op } from "sequelize";

import {
  DirectMessageConversation,
  Post,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { parseSearchQuery } from "@web-speed-hackathon-2026/server/src/utils/parse_search_query";

const TIMELINE_LIMIT = 6;
const SEARCH_LIMIT = 8;
const USER_POSTS_LIMIT = 8;
type HydratedPost = {
  user?: { profileImage?: { id?: string | null } | null } | null;
  images?: Array<{ id: string }> | null;
};
type HydratedConversation = {
  initiator: { id: string; profileImage?: { id?: string | null } | null };
  member: { id: string; profileImage?: { id?: string | null } | null };
  messages: Array<{ createdAt: string }>;
};
const DM_LIST_INCLUDE = [
  {
    association: "initiator",
    attributes: ["id", "name", "username"],
    include: [{ association: "profileImage", attributes: ["alt", "id"] }],
  },
  {
    association: "member",
    attributes: ["id", "name", "username"],
    include: [{ association: "profileImage", attributes: ["alt", "id"] }],
  },
  {
    association: "messages",
    attributes: ["body", "createdAt", "id", "isRead"],
    include: [{ association: "sender", attributes: ["id"] }],
    required: true,
  },
];
const DM_DETAIL_INCLUDE = [
  {
    association: "initiator",
    attributes: ["id", "name", "username"],
    include: [{ association: "profileImage", attributes: ["alt", "id"] }],
  },
  {
    association: "member",
    attributes: ["id", "name", "username"],
    include: [{ association: "profileImage", attributes: ["alt", "id"] }],
  },
  {
    association: "messages",
    attributes: ["body", "createdAt", "id", "isRead"],
    include: [{ association: "sender", attributes: ["id"] }],
    required: false,
  },
];

let indexHtmlPromise: Promise<string> | null = null;

function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.jpg`;
}

function serializeForInlineScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function addPostPreloads(
  preloads: Set<string>,
  post: HydratedPost | null | undefined,
) {
  if (post == null) {
    return;
  }

  if (post.user?.profileImage?.id) {
    preloads.add(getProfileImagePath(post.user.profileImage.id));
  }
  if (post.images?.[0]?.id) {
    preloads.add(getImagePath(post.images[0].id));
  }
}

async function getIndexHtmlTemplate() {
  indexHtmlPromise ??= readFile(path.join(CLIENT_DIST_PATH, "index.html"), "utf8");
  return indexHtmlPromise;
}

async function getDmConversations(userId: string) {
  const conversations = await DirectMessageConversation.unscoped().findAll({
    attributes: ["id"],
    include: DM_LIST_INCLUDE,
    where: {
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });

  return conversations
    .map((conversation) => {
      const json = conversation.toJSON();
      const messages = [...(json.messages ?? [])].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      return {
        ...json,
        messages,
      };
    })
    .sort((a, b) => {
      const aLast = a.messages.at(-1);
      const bLast = b.messages.at(-1);
      if (aLast == null || bLast == null) {
        return 0;
      }

      return new Date(bLast.createdAt).getTime() - new Date(aLast.createdAt).getTime();
    });
}

async function buildBootstrapData(req: Request) {
  const bootstrapData: Record<string, unknown> = {};
  const preloads = new Set<string>();
  const url = new URL(req.originalUrl, "http://localhost");
  const pathname = url.pathname;

  if (req.session.userId !== undefined && (pathname.startsWith("/dm") || pathname === "/crok")) {
    const activeUser = await User.findByPk(req.session.userId);
    if (activeUser != null) {
      bootstrapData["/api/v1/me"] = activeUser;
      if (activeUser.profileImage?.id) {
        preloads.add(getProfileImagePath(activeUser.profileImage.id));
      }
    }
  }

  if (pathname === "/") {
    const posts = await Post.findAll({ limit: TIMELINE_LIMIT, offset: 0 });
    bootstrapData[`/api/v1/posts?limit=${TIMELINE_LIMIT}&offset=0`] = posts;
    addPostPreloads(preloads, posts[0]?.toJSON() as unknown as HydratedPost | undefined);
  } else if (pathname.startsWith("/posts/")) {
    const postId = decodeURIComponent(pathname.slice("/posts/".length));
      const post = await Post.findByPk(postId);
    if (post != null) {
      bootstrapData[`/api/v1/posts/${postId}`] = post;
      addPostPreloads(preloads, post.toJSON() as unknown as HydratedPost);
    }
  } else if (pathname.startsWith("/users/")) {
    const username = decodeURIComponent(pathname.slice("/users/".length));
    const user = await User.findOne({ where: { username } });
    if (user != null) {
      bootstrapData[`/api/v1/users/${username}`] = user;
      const posts = await Post.findAll({
        limit: USER_POSTS_LIMIT,
        offset: 0,
        where: { userId: user.id },
      });
      bootstrapData[`/api/v1/users/${username}/posts?limit=${USER_POSTS_LIMIT}&offset=0`] = posts;
      addPostPreloads(preloads, posts[0]?.toJSON() as unknown as HydratedPost | undefined);
    }
  } else if (pathname === "/search") {
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (query !== "") {
      const { keywords, sinceDate, untilDate } = parseSearchQuery(query);
      if (keywords || sinceDate || untilDate) {
        const searchTerm = keywords ? `%${keywords}%` : null;
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
          limit: SEARCH_LIMIT,
          offset: 0,
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
                association: "user",
                attributes: ["id", "name", "username"],
                include: [{ association: "profileImage", attributes: ["alt", "id"] }],
                required: true,
                where: {
                  [Op.or]: [
                    { username: { [Op.like]: searchTerm } },
                    { name: { [Op.like]: searchTerm } },
                  ],
                },
              },
              {
                association: "images",
                attributes: ["alt", "id"],
                through: { attributes: [] },
              },
              { association: "movie", attributes: ["id"] },
              { association: "sound", attributes: ["artist", "id", "title"] },
            ],
            limit: SEARCH_LIMIT,
            offset: 0,
            subQuery: false,
            where: dateWhere,
          });
        }

        const mergedPosts: typeof postsByText = [];
        const seen = new Set<string>();
        for (const post of [...postsByText, ...postsByUser]) {
          if (!seen.has(post.id)) {
            seen.add(post.id);
            mergedPosts.push(post);
          }
        }

        mergedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        bootstrapData[
          `/api/v1/search?q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}&offset=0`
        ] = mergedPosts.slice(0, SEARCH_LIMIT);
        addPostPreloads(preloads, mergedPosts[0]?.toJSON() as unknown as HydratedPost | undefined);
      }
    }
  } else if (pathname === "/dm" && req.session.userId !== undefined) {
    const conversations = await getDmConversations(req.session.userId);
    bootstrapData["/api/v1/dm"] = conversations;
    const firstConversation = conversations[0] as unknown as HydratedConversation | undefined;
    const peer =
      firstConversation?.initiator.id !== req.session.userId
        ? firstConversation?.initiator
        : firstConversation?.member;
    if (peer?.profileImage?.id) {
      preloads.add(getProfileImagePath(peer.profileImage.id));
    }
  } else if (pathname.startsWith("/dm/") && req.session.userId !== undefined) {
    const conversationId = decodeURIComponent(pathname.slice("/dm/".length));
    const conversation = await DirectMessageConversation.unscoped().findOne({
      attributes: ["id"],
      include: DM_DETAIL_INCLUDE,
      where: {
        id: conversationId,
        [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
      },
    });

    if (conversation != null) {
      const json = conversation.toJSON() as unknown as HydratedConversation;
      const messages = [...(json.messages ?? [])].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      bootstrapData[`/api/v1/dm/${conversationId}`] = {
        ...json,
        messages,
      };

      const peer =
        json.initiator.id !== req.session.userId ? json.initiator : json.member;
      if (peer.profileImage?.id) {
        preloads.add(getProfileImagePath(peer.profileImage.id));
      }
    }
  }

  return { bootstrapData, preloads };
}

export async function renderAppHtml(req: Request) {
  const [template, { bootstrapData, preloads }] = await Promise.all([
    getIndexHtmlTemplate(),
    buildBootstrapData(req),
  ]);

  const preloadTags = [...preloads]
    .map((href) => `<link rel="preload" as="image" href="${href}" />`)
    .join("");
  const bootstrapScript =
    Object.keys(bootstrapData).length > 0
      ? `<script>window.__BOOTSTRAP_DATA__=${serializeForInlineScript(bootstrapData)};</script>`
      : "";

  return template.replace("</head>", `${preloadTags}${bootstrapScript}</head>`);
}
