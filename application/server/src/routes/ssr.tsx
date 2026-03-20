import { renderToString } from "react-dom/server";
import { MemoryRouter, StaticRouter } from "react-router";
import { SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import type { SWRInfiniteKeyLoader } from "swr/infinite";

import { AppContainerSsrContent } from "@web-speed-hackathon-2026/client/src/containers/AppContainerSsrContent";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";

export type SsrPost = Models.Post;

export type SsrComment = Models.Comment;

const INFINITE_LIMIT = 30;

export type SsrFallback = Record<string, unknown>;

function buildPaginatedPath(apiPath: string, offset: number, limit: number): string {
  const [rawPath, rawQuery = ""] = apiPath.split("?");
  const path = rawPath ?? "";
  const params = new URLSearchParams(rawQuery);

  params.set("offset", String(offset));
  params.set("limit", String(limit));

  const query = params.toString();
  return query === "" ? path : `${path}?${query}`;
}

export function buildSsrInfiniteCacheKey(apiPath: string, limit?: number): string {
  const effectiveLimit = limit ?? INFINITE_LIMIT;
  const getKey: SWRInfiniteKeyLoader = (index) => {
    if (apiPath === "") {
      return null;
    }

    return buildPaginatedPath(apiPath, index * effectiveLimit, effectiveLimit);
  };

  return unstable_serialize(getKey);
}

export function getSsrFirstPagePath(apiPath: string, limit?: number): string {
  const effectiveLimit = limit ?? INFINITE_LIMIT;
  return buildPaginatedPath(apiPath, 0, effectiveLimit);
}

/**
 * 全ページ対応の汎用 SSR 関数
 * AppContainer をそのまま SSR する
 * （SWRConfig はクライアント側で wrap される）
 */
export function renderAppSsr(params: {
  location: string;
  activeUser: Models.User | null;
  swrFallback?: SsrFallback;
}) {
  const { location, activeUser, swrFallback = {} } = params;

  // ダミーのコールバック（サーバー側では実行されない）
  const handleLogout = () => { };
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const handleUpdateActiveUser = () => { };

  return renderToString(
    <SWRConfig value={{ fallback: swrFallback }}>
      <StaticRouter location={location}>
        <AppContainerSsrContent
          activeUser={activeUser}
          authModalId="auth-modal"
          newPostModalId="new-post-modal"
          onLogout={handleLogout}
          onUpdateActiveUser={handleUpdateActiveUser}
        />
      </StaticRouter>
    </SWRConfig>,
  );
}

/**
 * 旧: PostPage SSR（後方互換性のため残す）
 */
export type SsrPostDeprecated = Models.Post;

export type SsrCommentDeprecated = Models.Comment;

export function renderPostPageSsr(params: {
  comments: SsrCommentDeprecated[];
  location: string;
  post: SsrPostDeprecated;
  activeUser: Models.User | null;
}) {
  const { comments, location, post, activeUser } = params;

  const handleLogout = () => { };

  return renderToString(
    <MemoryRouter initialEntries={[location]}>
      <AppPage
        activeUser={activeUser}
        authModalId="auth-modal"
        newPostModalId="new-post-modal"
        onLogout={handleLogout}
      >
        <PostPage comments={comments} post={post} />
      </AppPage>
    </MemoryRouter>,
  );
}
