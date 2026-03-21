import { Post } from "@web-speed-hackathon-2026/server/src/models";

function escapeHtml(value: unknown): string {
  const text = String(value ?? "");
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLoadingShell(pathname: string): string {
  const heading = pathname.startsWith("/crok") ? "Crok" : "CaX";
  return `<main class="mx-auto max-w-2xl px-4 py-6"><h1 class="text-cax-text text-2xl font-bold">${heading}</h1><p class="text-cax-text-muted mt-2 text-sm">Loading...</p></main>`;
}

export async function renderAppShell(pathname: string): Promise<string> {
  if (pathname !== "/") {
    return renderLoadingShell(pathname);
  }

  try {
    const posts = await Post.findAll({ limit: 30, offset: 0 });
    const items = posts
      .map((post) => {
        const json = post.toJSON() as unknown as {
          createdAt: string;
          id: string;
          text: string;
          user?: { name?: string; username?: string };
        };

        return `<article class="border-cax-border border-b px-4 py-3"><p class="text-cax-text text-sm font-bold">${escapeHtml(json.user?.name)} <span class="text-cax-text-muted font-normal">@${escapeHtml(json.user?.username)}</span></p><p class="text-cax-text mt-1 whitespace-pre-wrap">${escapeHtml(json.text)}</p><p class="text-cax-text-muted mt-1 text-xs">${escapeHtml(json.createdAt)}</p></article>`;
      })
      .join("");

    const content =
      items.length > 0
        ? items
        : '<p class="text-cax-text-muted mt-2 text-sm">投稿がまだありません。</p>';

    return `<main class="mx-auto max-w-2xl px-4 py-6"><h1 class="text-cax-text text-2xl font-bold">CaX</h1><section class="mt-4">${content}</section></main>`;
  } catch {
    return renderLoadingShell(pathname);
  }
}
