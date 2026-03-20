import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const { data: post, error: postError, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
  );

  if (isLoadingPost) {
    return (
      <InfiniteScroll fetchMore={() => {}} items={[]}>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
        <section className="px-4 py-6">
          <div className="bg-cax-surface-subtle border-cax-border animate-pulse h-6 w-32 rounded border" />
          <div className="bg-cax-surface-subtle border-cax-border animate-pulse mt-4 h-6 w-48 rounded border" />
          <div className="bg-cax-surface-subtle border-cax-border animate-pulse mt-4 h-40 rounded border" />
          <div className="bg-cax-surface-subtle border-cax-border animate-pulse mt-4 h-48 rounded border" />
          <div className="bg-cax-surface-subtle border-cax-border animate-pulse mt-6 h-24 rounded border" />
        </section>
      </InfiniteScroll>
    );
  }

  if (postError) {
    return (
      <InfiniteScroll fetchMore={() => {}} items={[]}>
        <Helmet>
          <title>読み込みエラー - CaX</title>
        </Helmet>
        <section className="px-4 py-6">
          <p className="text-cax-danger text-sm">投稿の取得に失敗しました。再読み込みしてください。</p>
        </section>
      </InfiniteScroll>
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
