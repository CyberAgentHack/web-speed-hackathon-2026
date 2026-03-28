import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import {
  fetchJSON,
  fetchPaginatedJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchPaginatedJSON,
  );

  if (isLoadingPost) {
    return (
      <>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>

        <section className="px-1 sm:px-4">
          <div className="border-cax-border border-b px-4 pt-4 pb-4">
            <div className="flex items-center justify-center">
              <div className="bg-cax-surface-subtle h-14 w-14 rounded-full sm:h-16 sm:w-16" />
              <div className="min-w-0 grow pl-2">
                <div className="bg-cax-surface-subtle h-5 w-32 rounded" />
                <div className="bg-cax-surface-subtle mt-2 h-4 w-24 rounded" />
              </div>
            </div>

            <div className="pt-4">
              <div className="bg-cax-surface-subtle h-6 w-3/4 rounded" />
              <div className="bg-cax-surface-subtle mt-2 h-6 w-2/3 rounded" />
              <div className="bg-cax-surface-subtle mt-4 aspect-[16/9] w-full rounded-lg" />
            </div>
          </div>
        </section>
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