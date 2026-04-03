import { readFileSync } from "fs";
import path from "path";

import { Request, Response, Router } from "express";

import { CLIENT_DIST_PATH } from "@web-speed-hackathon-2026/server/src/paths";
import { Post } from "@web-speed-hackathon-2026/server/src/models/Post";

const rawTemplate = readFileSync(path.resolve(CLIENT_DIST_PATH, "index.html"), "utf-8");

const shellHtml = `<div style="display:flex;justify-content:center;font-family:sans-serif"><div style="display:flex;min-height:100vh;max-width:100%"><aside style="width:72px"></aside><main style="width:100%;max-width:640px;padding:16px;color:#042f2e">読込中...</main></div></div>`;

const htmlTemplate = rawTemplate.replace(
  '<div id="app"></div>',
  `<div id="app">${shellHtml}</div>`,
);

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildTimelineHtml(posts: any[]): string {
  const items = posts.map((p) => {
    const post = p.toJSON ? p.toJSON() : p;
    const userName = escapeHtml(post.user?.name || "");
    const userUsername = escapeHtml(post.user?.username || "");
    const text = escapeHtml(post.text || "");
    const profileImageId = post.user?.profileImage?.id || "";

    return `<article style="padding:4px 16px">
<div style="display:flex;border-bottom:1px solid #d6d3d1;padding:8px 0 16px">
<div style="flex-shrink:0;padding-right:12px">
<div style="width:48px;height:48px;border-radius:50%;overflow:hidden;border:1px solid #d6d3d1;background:#f5f5f4">
<img src="/images/profiles/${profileImageId}.jpg" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover" />
</div>
</div>
<div style="min-width:0;flex:1">
<p style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
<span style="font-weight:bold;color:#042f2e">${userName}</span>
<span style="color:#64748b;padding-left:4px">@${userUsername}</span>
</p>
<p style="font-size:14px;color:#042f2e;line-height:1.6">${text}</p>
</div>
</div>
</article>`;
  }).join("");

  return `<div style="display:flex;justify-content:center;font-family:sans-serif">
<div style="display:flex;min-height:100vh;max-width:100%">
<nav style="width:72px;min-height:100vh;border-right:1px solid #d6d3d1;padding:16px 8px"></nav>
<main style="width:100%;max-width:640px">${items}</main>
</div>
</div>`;
}

function buildTermsHtml(): string {
  return `<div style="display:flex;justify-content:center;font-family:sans-serif">
<div style="display:flex;min-height:100vh;max-width:100%">
<nav style="width:72px;min-height:100vh;border-right:1px solid #d6d3d1;padding:16px 8px"></nav>
<main style="width:100%;max-width:640px">
<article style="padding:8px 16px;line-height:1.6;font-size:14px;color:#042f2e">
<h1 style="font-size:1.875rem;font-weight:bold;margin:16px 0 8px;font-family:Rei no Are Mincho,serif">利用規約</h1>
<p>この利用規約（以下、「本規約」といいます。）は、株式会社&nbsp;架空の会社（以下、「当社」といいます。）がこのウェブサイト上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。</p>
<h2 style="font-size:1.5rem;font-weight:bold;margin:16px 0 8px;font-family:Rei no Are Mincho,serif">第1条（適用）</h2>
<p>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
</article>
</main>
</div>
</div>`;
}

export const ssrRouter = Router();

ssrRouter.use("{*path}", async (req: Request, res: Response) => {
  try {
    const depth = req.originalUrl.split("/").filter(Boolean).length;
    if (depth === 0) {
      const posts = await Post.findAll({ limit: 7, offset: 0 });
      const postsJson = JSON.stringify(posts);
      const timelineHtml = buildTimelineHtml(posts);
      const script = `<script>window.__INITIAL_POSTS__=${postsJson};</script>`;
      const html = rawTemplate
        .replace('<div id="app"></div>', `<div id="app">${timelineHtml}</div>`)
        .replace('</head>', `${script}</head>`);
      return res.status(200).type("text/html").send(html);
    }
    if (req.originalUrl === "/terms") {
      const termsHtml = buildTermsHtml();
      const html = rawTemplate.replace('<div id="app"></div>', `<div id="app">${termsHtml}</div>`);
      return res.status(200).type("text/html").send(html);
    }
  } catch {
    // フォールバック
  }
  res.status(200).type("text/html").send(htmlTemplate);
});
