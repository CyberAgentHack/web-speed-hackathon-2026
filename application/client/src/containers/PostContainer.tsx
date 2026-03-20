import { Helmet } from "react-helmet";
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
  const commentsApiPath = !isLoadingPost && post !== null ? `/api/v1/posts/${postId}/comments` : "";

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    commentsApiPath,
    fetchJSON,
  );

  if (isLoadingPost) {
    return (
      <>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
        <div className="animate-pulse space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-cax-border h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-cax-border h-3 w-1/4 rounded" />
              <div className="bg-cax-border h-3 w-1/6 rounded" />
            </div>
          </div>
          <div className="bg-cax-border h-4 w-full rounded" />
          <div className="bg-cax-border h-4 w-5/6 rounded" />
          <div className="bg-cax-border h-4 w-4/6 rounded" />
        </div>
      </>
    );
  }

  if (post === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={comments}>
      <Helmet>
        <title>{post.user.name} さんのつぶやき - CaX</title>
      </Helmet>
      <PostPage comments={comments} post={post} />
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};
