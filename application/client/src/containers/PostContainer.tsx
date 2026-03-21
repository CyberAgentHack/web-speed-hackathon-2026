import { useLocation, useParams } from "react-router";

import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/application/PageTitle";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const location = useLocation();
  const initialPost = (location.state as { initialPost?: Models.Post } | null)?.initialPost;

  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
  );
  const fallbackPost: Models.Post | null =
    initialPost !== undefined && initialPost.id === postId ? initialPost : null;
  const resolvedPost: Models.Post | null = post ?? fallbackPost;

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
  );

  if (isLoadingPost && resolvedPost === null) {
    return <PageTitle title="読込中 - CaX" />;
  }

  if (resolvedPost === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={comments}>
      <PageTitle title={`${resolvedPost.user.name} さんのつぶやき - CaX`} />
      <PostPage comments={comments} post={resolvedPost} />
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};
