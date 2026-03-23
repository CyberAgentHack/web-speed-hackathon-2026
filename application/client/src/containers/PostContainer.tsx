import { useEffect } from "react";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
  );

  useEffect(() => {
    if (isLoadingPost) {
      document.title = "読込中 - CaX";
    } else if (post !== null) {
      document.title = `${post.user.name} さんのつぶやき - CaX`;
    }
  }, [isLoadingPost, post]);

  if (isLoadingPost) {
    return (
      <article className="px-1 sm:px-4">
        <div className="border-cax-border border-b px-4 pt-4 pb-4">
          <div className="flex items-center justify-center">
            <div className="shrink-0 grow-0 pr-2">
              <div className="bg-cax-surface-subtle h-14 w-14 rounded-full sm:h-16 sm:w-16" />
            </div>
            <div className="min-w-0 shrink grow">
              <div className="bg-cax-surface-subtle mb-1 h-4 w-24 rounded" />
              <div className="bg-cax-surface-subtle h-3 w-16 rounded" />
            </div>
          </div>
          <div className="pt-2 sm:pt-4">
            <div className="bg-cax-surface-subtle mb-2 h-6 w-full rounded" />
            <div className="bg-cax-surface-subtle mb-2 h-6 w-3/4 rounded" />
            <div className="bg-cax-surface-subtle h-6 w-1/2 rounded" />
          </div>
        </div>
      </article>
    );
  }

  if (post === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={comments}>
      <PostPage comments={comments} post={post} />
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};

export default PostContainer;
