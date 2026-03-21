import { useEffect } from "react";
import { useParams } from "react-router";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { useSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-context";
import { createInfiniteKey, swrFetcher } from "@web-speed-hackathon-2026/client/src/api/swr";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";

function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title && typeof document !== "undefined") {
      document.title = title;
    }
  }, [title]);
}

const PAGE_SIZE = 30;

const PostContainerContent = ({ postId }: { postId: string }) => {
  const ssrData = useSSRData();
  const ssrPost = ssrData?.post;
  const ssrComments = ssrData?.comments;

  const { data: post, isLoading: isLoadingPost } = useSWR<Models.Post | null, Error, string>(
    `/api/v1/posts/${postId}`,
    swrFetcher,
    ssrPost !== undefined
      ? { fallbackData: ssrPost as Models.Post | null, revalidateOnMount: false }
      : undefined,
  );

  const getKey = createInfiniteKey(`/api/v1/posts/${postId}/comments`);
  const { data, setSize, isValidating } = useSWRInfinite<Models.Comment[]>(getKey, {
    revalidateFirstPage: false,
    initialSize: ssrComments ? 1 : 0,
    ...(ssrComments ? { fallbackData: [ssrComments], revalidateOnMount: false } : {}),
  });

  const comments = data ? data.flat() : (ssrComments ?? []);
  const hasMore = data ? (data[data.length - 1]?.length ?? 0) >= PAGE_SIZE : !data;

  const pageTitle = post
    ? `${post.user.name} さんのつぶやき - CaX`
    : isLoadingPost
      ? "読込中 - CaX"
      : undefined;
  useDocumentTitle(pageTitle);

  if (isLoadingPost) {
    return (
      <>
        <title>読込中 - CaX</title>
        <article className="px-1 sm:px-4">
          <div className="border-cax-border border-b px-4 pt-4 pb-4" />
        </article>
      </>
    );
  }

  if (post === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll
      fetchMore={() => setSize((s) => s + 1)}
      items={comments}
      hasMore={hasMore}
      isLoading={isValidating}
    >
      <title>{post!.user.name} さんのつぶやき - CaX</title>
      <PostPage comments={comments} post={post!} />
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  if (!postId) return null;
  return <PostContainerContent key={postId} postId={postId} />;
};
