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

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function renderAppShell(content: string): string {
  return [
    '<div class="relative z-0 flex justify-center font-sans">',
    '<div class="bg-cax-surface text-cax-text flex min-h-screen max-w-full">',
    '<aside class="relative z-10">',
    '<nav class="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r"></nav>',
    "</aside>",
    '<main class="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0">',
    content,
    "</main>",
    "</div>",
    "</div>",
  ].join("");
}

function renderTimelineShell(posts: Array<any>): string {
  return posts
    .slice(0, 2)
    .map((post, index) => {
      const profileImage = post.user?.profileImage?.id
        ? `<img alt="${escapeHtml(post.user.profileImage.alt ?? "")}" class="h-full w-full object-cover" decoding="${index === 0 ? "sync" : "async"}" fetchpriority="${index === 0 ? "high" : "auto"}" height="64" loading="${index === 0 ? "eager" : "lazy"}" src="${getProfileImagePath(post.user.profileImage.id)}" width="64" />`
        : "";
      const heroImage = post.images?.[0]?.id
        ? `<div class="relative mt-2 w-full"><div class="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border" style="aspect-ratio:16 / 9"><div class="${post.images.length === 1 ? "col-span-2 row-span-2" : "col-span-1 row-span-2"} bg-cax-surface-subtle"><img alt="${escapeHtml(post.images[0].alt ?? "")}" class="h-full w-full object-cover" decoding="${index === 0 ? "sync" : "async"}" fetchpriority="${index === 0 ? "high" : "auto"}" loading="${index === 0 ? "eager" : "lazy"}" src="${getImagePath(post.images[0].id)}" /></div></div></div>`
        : "";

      return [
        '<article class="hover:bg-cax-surface-subtle px-1 sm:px-4">',
        '<div class="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">',
        '<div class="shrink-0 grow-0 pr-2 sm:pr-4">',
        `<a class="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border sm:h-16 sm:w-16" href="/users/${escapeHtml(post.user.username)}">${profileImage}</a>`,
        "</div>",
        '<div class="min-w-0 shrink grow">',
        '<p class="overflow-hidden text-sm text-ellipsis whitespace-nowrap">',
        `<a class="text-cax-text pr-1 font-bold" href="/users/${escapeHtml(post.user.username)}">${escapeHtml(post.user.name)}</a>`,
        `<a class="text-cax-text-muted pr-1" href="/users/${escapeHtml(post.user.username)}">@${escapeHtml(post.user.username)}</a>`,
        "</p>",
        `<div class="text-cax-text leading-relaxed">${escapeHtml(post.text ?? "")}</div>`,
        heroImage,
        "</div>",
        "</div>",
        "</article>",
      ].join("");
    })
    .join("");
}

function renderPostShell(post: any): string {
  const profileImage = post.user?.profileImage?.id
    ? `<img alt="${escapeHtml(post.user.profileImage.alt ?? "")}" class="h-full w-full object-cover" decoding="sync" fetchpriority="high" height="64" loading="eager" src="${getProfileImagePath(post.user.profileImage.id)}" width="64" />`
    : "";
  const heroImage = post.images?.[0]?.id
    ? `<div class="relative mt-2 w-full"><div class="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border" style="aspect-ratio:16 / 9"><div class="${post.images.length === 1 ? "col-span-2 row-span-2" : "col-span-1 row-span-2"} bg-cax-surface-subtle"><img alt="${escapeHtml(post.images[0].alt ?? "")}" class="h-full w-full object-cover" decoding="sync" fetchpriority="high" loading="eager" src="${getImagePath(post.images[0].id)}" /></div></div></div>`
    : "";

  return [
    '<article class="px-1 sm:px-4">',
    '<div class="border-cax-border border-b px-4 pt-4 pb-4">',
    '<div class="flex items-center justify-center">',
    '<div class="shrink-0 grow-0 pr-2">',
    `<a class="border-cax-border bg-cax-surface-subtle block h-14 w-14 overflow-hidden rounded-full border sm:h-16 sm:w-16" href="/users/${escapeHtml(post.user.username)}">${profileImage}</a>`,
    "</div>",
    '<div class="min-w-0 shrink grow overflow-hidden text-ellipsis whitespace-nowrap">',
    `<p><a class="text-cax-text font-bold" href="/users/${escapeHtml(post.user.username)}">${escapeHtml(post.user.name)}</a></p>`,
    `<p><a class="text-cax-text-muted" href="/users/${escapeHtml(post.user.username)}">@${escapeHtml(post.user.username)}</a></p>`,
    "</div>",
    "</div>",
    '<div class="pt-2 sm:pt-4">',
    `<div class="text-cax-text text-xl leading-relaxed">${escapeHtml(post.text ?? "")}</div>`,
    heroImage,
    "</div>",
    "</div>",
    "</article>",
  ].join("");
}

function renderDmListShell(conversations: Array<any>, activeUserId: string): string {
  const items = conversations
    .slice(0, 4)
    .map((conversation) => {
      const peer =
        conversation.initiator.id !== activeUserId ? conversation.initiator : conversation.member;
      const lastMessage = conversation.messages?.at(-1);
      return [
        '<li class="grid" style="contain-intrinsic-size:120px;content-visibility:auto">',
        `<a class="hover:bg-cax-surface-subtle px-4" href="/dm/${escapeHtml(conversation.id)}">`,
        '<div class="border-cax-border flex gap-4 border-b px-4 pt-2 pb-4">',
        `<img alt="${escapeHtml(peer.profileImage?.alt ?? "")}" class="w-12 shrink-0 self-start rounded-full object-cover" decoding="sync" fetchpriority="high" height="48" loading="eager" src="${getProfileImagePath(peer.profileImage.id)}" width="48" />`,
        '<div class="flex flex-1 flex-col">',
        `<div><p class="font-bold">${escapeHtml(peer.name)}</p><p class="text-cax-text-muted text-xs">@${escapeHtml(peer.username)}</p></div>`,
        `<p class="mt-1 line-clamp-2 text-sm wrap-anywhere">${escapeHtml(lastMessage?.body ?? "")}</p>`,
        "</div></div></a></li>",
      ].join("");
    })
    .join("");

  return [
    '<section><header class="border-cax-border flex flex-col gap-4 border-b px-4 pt-6 pb-4">',
    '<h1 class="text-2xl font-bold">ダイレクトメッセージ</h1>',
    '<div class="flex flex-wrap items-center gap-4"><button class="flex items-center justify-center gap-2 rounded-full px-4 py-2 border bg-cax-brand text-cax-surface-raised border-transparent" type="button"><span>新しくDMを始める</span></button></div>',
    "</header>",
    `<ul data-testid="dm-list">${items}</ul>`,
    "</section>",
  ].join("");
}

function renderDmDetailShell(conversation: any, activeUserId: string): string {
  const peer = conversation.initiator.id !== activeUserId ? conversation.initiator : conversation.member;
  const messages = (conversation.messages ?? []).slice(-6);

  return [
    '<section class="bg-cax-surface flex min-h-[calc(100vh-(--spacing(12)))] flex-col lg:min-h-screen">',
    '<header class="border-cax-border bg-cax-surface sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">',
    `<img alt="${escapeHtml(peer.profileImage?.alt ?? "")}" class="h-12 w-12 rounded-full object-cover" decoding="sync" fetchpriority="high" height="48" loading="eager" src="${getProfileImagePath(peer.profileImage.id)}" width="48" />`,
    `<div class="min-w-0"><h1 class="overflow-hidden text-xl font-bold text-ellipsis whitespace-nowrap">${escapeHtml(peer.name)}</h1><p class="text-cax-text-muted overflow-hidden text-xs text-ellipsis whitespace-nowrap">@${escapeHtml(peer.username)}</p></div>`,
    "</header>",
    '<div class="bg-cax-surface-subtle flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-8"><ul class="grid gap-3" data-testid="dm-message-list">',
    ...messages.map((message: any) => {
      const isMine = message.sender.id === activeUserId;
      return [
        `<li class="flex flex-col w-full ${isMine ? "items-end" : "items-start"}">`,
        `<p class="max-w-3/4 rounded-xl border px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed wrap-anywhere ${isMine ? "rounded-br-sm border-transparent bg-cax-brand text-cax-surface-raised" : "rounded-bl-sm border-cax-border bg-cax-surface text-cax-text"}">${escapeHtml(message.body)}</p>`,
        "</li>",
      ].join("");
    }).join(""),
    "</ul></div></section>",
  ].join("");
}

async function buildBootstrapData(req: Request) {
  const bootstrapData: Record<string, unknown> = {};
  const preloads = new Set<string>();
  let shellMarkup = "";
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
    shellMarkup = renderAppShell(renderTimelineShell(posts.map((post) => post.toJSON())));
  } else if (pathname.startsWith("/posts/")) {
    const postId = decodeURIComponent(pathname.slice("/posts/".length));
    const post = await Post.findByPk(postId);
    if (post != null) {
      bootstrapData[`/api/v1/posts/${postId}`] = post;
      addPostPreloads(preloads, post.toJSON() as unknown as HydratedPost);
      shellMarkup = renderAppShell(renderPostShell(post.toJSON()));
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
      shellMarkup = renderAppShell(renderTimelineShell(posts.map((post) => post.toJSON())));
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
    shellMarkup = renderAppShell(renderDmListShell(conversations, req.session.userId));
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
      shellMarkup = renderAppShell(
        renderDmDetailShell(
          {
            ...json,
            messages,
          },
          req.session.userId,
        ),
      );
    }
  }

  return { bootstrapData, preloads, shellMarkup };
}

export async function renderAppHtml(req: Request) {
  const [template, { bootstrapData, preloads, shellMarkup }] = await Promise.all([
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
  const appShell =
    shellMarkup !== ""
      ? `<div id="prerender-shell">${shellMarkup}</div><div id="app"></div>`
      : '<div id="app"></div>';

  return template
    .replace(
      '<body class="bg-cax-canvas text-cax-text">',
      `<body class="bg-cax-canvas text-cax-text"${
        shellMarkup !== "" ? ' data-has-prerender="1" data-app-mounted="0"' : ""
      }>`,
    )
    .replace('<div id="app"></div>', appShell)
    .replace("</head>", `${preloadTags}${bootstrapScript}</head>`);
}
