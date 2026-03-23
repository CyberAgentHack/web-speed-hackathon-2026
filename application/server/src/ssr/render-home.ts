/**
 * ホームページの軽量プリレンダリング
 * フルReact SSRではなく、先頭の投稿をHTMLとして生成しFCP/LCPを改善する
 */

interface PostData {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
    profileImage: { id: string; alt: string };
  };
  images?: Array<{ id: string; alt: string }>;
  movie?: { id: string };
  sound?: { id: string; title: string; artist: string };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPostItem(post: PostData, isFirst: boolean): string {
  const profileImg = `/images/profiles/${encodeURIComponent(post.user.profileImage.id)}.webp`;
  const date = new Date(post.createdAt);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

  let mediaHtml = "";
  if (post.images && post.images.length > 0) {
    const img = post.images[0]!;
    const imgSrc = `/images/${encodeURIComponent(img.id)}.webp`;
    mediaHtml = `<div class="relative mt-2 w-full"><div class="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border"><img alt="${escapeHtml(img.alt || "")}" class="h-full w-full object-cover" src="${imgSrc}" width="1200" height="675" ${isFirst ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="${isFirst ? "sync" : "async"}"></div></div>`;
  } else if (post.movie) {
    const posterSrc = `/movies/${encodeURIComponent(post.movie.id)}.poster.webp`;
    mediaHtml = `<div class="relative mt-2 w-full"><div class="border-cax-border bg-cax-surface-subtle relative h-full w-full overflow-hidden rounded-lg border" data-movie-area><div style="aspect-ratio:1/1"><div class="h-full w-full"><img alt="" class="h-full w-full object-cover" src="${posterSrc}" ${isFirst ? 'fetchpriority="high"' : 'loading="lazy"'}></div></div></div></div>`;
  }

  return `<article class="hover:bg-cax-surface-subtle px-1 sm:px-4"><div class="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4"><div class="shrink-0 grow-0 pr-2 sm:pr-4"><a class="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16" href="/users/${encodeURIComponent(post.user.username)}"><img alt="${escapeHtml(post.user.profileImage.alt || "")}" class="h-full w-full object-cover" height="64" src="${profileImg}" width="64"></a></div><div class="min-w-0 shrink grow"><p class="overflow-hidden text-sm text-ellipsis whitespace-nowrap"><a class="text-cax-text pr-1 font-bold hover:underline" href="/users/${encodeURIComponent(post.user.username)}">${escapeHtml(post.user.name)}</a><a class="text-cax-text-muted pr-1 hover:underline" href="/users/${encodeURIComponent(post.user.username)}">@${escapeHtml(post.user.username)}</a><span class="text-cax-text-muted pr-1">-</span><a class="text-cax-text-muted pr-1 hover:underline" href="/posts/${encodeURIComponent(post.id)}"><time datetime="${date.toISOString()}">${dateStr}</time></a></p><div class="text-cax-text leading-relaxed"><p>${escapeHtml(post.text)}</p></div>${mediaHtml}</div></div></article>`;
}

export function renderHomeTimeline(posts: unknown[]): string {
  const items = (posts as PostData[])
    .slice(0, 5)
    .map((post, i) => renderPostItem(post, i === 0))
    .join("");

  // AppPage と同じレイアウトシェルで包み、React 置換時の CLS を抑制する
  return `<div class="relative z-0 flex justify-center font-sans"><div class="bg-cax-surface text-cax-text flex min-h-screen max-w-full"><aside class="relative z-10"></aside><main class="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0"><section>${items}</section></main></div></div>`;
}
