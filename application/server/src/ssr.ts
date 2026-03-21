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

function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.webp`;
}

function toValidDate(value: string | number | Date): Date | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIsoString(value: string | number | Date): string {
  return toValidDate(value)?.toISOString() ?? "";
}

function formatDateJa(value: string | number | Date): string {
  const date = toValidDate(value);
  return date ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(date) : "";
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
          user?: {
            name?: string;
            username?: string;
            profileImage?: { alt?: string; id?: string };
          };
        };
        const username = json.user?.username ?? "";
        const profileImage = json.user?.profileImage;
        const profileImageSrc = profileImage?.id
          ? getProfileImagePath(profileImage.id)
          : getProfileImagePath("default");
        const userDisplayName = json.user?.name?.trim() || "ユーザー";
        const profileImageAlt = profileImage?.alt ?? `${userDisplayName}のプロフィール画像`;
        const dateTime = toIsoString(json.createdAt);
        const formattedDate = formatDateJa(json.createdAt);

        return `<article class="hover:bg-cax-surface-subtle px-1 sm:px-4"><div class="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4"><div class="shrink-0 grow-0 pr-2 sm:pr-4"><a class="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16" href="/users/${encodeURIComponent(username)}"><img alt="${escapeHtml(profileImageAlt)}" class="h-full w-full object-cover" decoding="async" loading="lazy" src="${escapeHtml(profileImageSrc)}" /></a></div><div class="min-w-0 shrink grow"><p class="overflow-hidden text-sm text-ellipsis whitespace-nowrap"><a class="text-cax-text pr-1 font-bold hover:underline" href="/users/${encodeURIComponent(username)}">${escapeHtml(userDisplayName)}</a><a class="text-cax-text-muted pr-1 hover:underline" href="/users/${encodeURIComponent(username)}">@${escapeHtml(username)}</a><span class="text-cax-text-muted pr-1">-</span><a class="text-cax-text-muted pr-1 hover:underline" href="/posts/${escapeHtml(json.id)}"><time dateTime="${escapeHtml(dateTime)}">${escapeHtml(formattedDate)}</time></a></p><div class="text-cax-text leading-relaxed">${escapeHtml(json.text)}</div></div></div></article>`;
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
