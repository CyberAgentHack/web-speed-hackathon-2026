import { Helmet } from "react-helmet";
import { useParams } from "react-router";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { createInfiniteKey, swrFetcher } from "@web-speed-hackathon-2026/client/src/api/swr";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";

const PostContainerContent = ({ postId }: { postId: string }) => {
  const { data: post, isLoading: isLoadingPost } = useSWR<Models.Post | null, Error, string>(
    `/api/v1/posts/${postId}`,
    swrFetcher,
  );

  const getKey = createInfiniteKey(`/api/v1/posts/${postId}/comments`);
  const { data, setSize } = useSWRInfinite<Models.Comment[]>(getKey, {
    revalidateFirstPage: false,
  });

  const comments = data ? data.flat() : [];

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
    <InfiniteScroll fetchMore={() => setSize((s) => s + 1)} items={comments}>
      <Helmet>
        <title>{post!.user.name} さんのつぶやき - CaX</title>
      </Helmet>
      <PostPage comments={comments} post={post!} />
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  if (!postId) return null;
  return <PostContainerContent key={postId} postId={postId} />;
};
