import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const { data: post, loading: isLoadingPost } = useFetch<Models.Post>(
    postId ? `/api/v1/posts/${postId}` : ""
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    postId ? `/api/v1/posts/${postId}/comments` : ""
  );

  if (!postId) {
    return <NotFoundContainer />;
  }

  if (isLoadingPost) {
    return (
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
    );
  }

  if (!post) {
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

  return <PostContainerContent postId={postId} />;
};
