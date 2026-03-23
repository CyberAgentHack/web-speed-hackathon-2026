import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const PostLoadingPlaceholder = () => {
  return (
    <>
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
      <article className="px-1 sm:px-4">
        <div className="border-cax-border border-b px-4 pt-4 pb-4">
          <div className="flex items-center justify-center">
            <div className="bg-cax-surface-subtle border-cax-border h-14 w-14 shrink-0 grow-0 rounded-full border sm:h-16 sm:w-16" />
            <div className="min-w-0 shrink grow pl-2">
              <p className="bg-cax-surface-subtle h-6 w-32 rounded" />
              <p className="bg-cax-surface-subtle mt-2 h-5 w-24 rounded" />
            </div>
          </div>
          <div className="pt-2 sm:pt-4">
            <p className="text-cax-text text-xl leading-relaxed">投稿を読み込んでいます...</p>
            <div className="bg-cax-surface-subtle mt-2 aspect-square w-full rounded-lg" />
          </div>
        </div>
      </article>
    </>
  );
};

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
    return <PostLoadingPlaceholder />;
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
