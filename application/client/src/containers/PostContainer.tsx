import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface PostContainerContentProps {
  postId: string | undefined;
  ssrPost?: Models.Post | null;
  ssrComments?: Models.Comment[];
}

const PostContainerContent = ({ postId, ssrPost, ssrComments }: PostContainerContentProps) => {
  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
    ssrPost,
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
    ssrComments,
  );

  if (isLoadingPost) {
    return (
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
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

interface PostContainerProps {
  ssrPost?: Models.Post | null;
  ssrComments?: Models.Comment[];
}

export const PostContainer = ({ ssrPost, ssrComments }: PostContainerProps) => {
  const { postId } = useParams();
  return (
    <PostContainerContent
      key={postId}
      postId={postId}
      ssrPost={ssrPost}
      ssrComments={ssrComments}
    />
  );
};
