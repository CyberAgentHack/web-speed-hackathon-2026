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

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
  );

  if (isLoadingPost) {
    return (
      <>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
        <div className="bg-cax-canvas min-h-screen p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-stone-200 rounded w-1/3" />
            <div className="h-4 bg-stone-200 rounded w-full" />
            <div className="h-4 bg-stone-200 rounded w-5/6" />
            <div className="h-48 bg-stone-200 rounded" />
          </div>
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
