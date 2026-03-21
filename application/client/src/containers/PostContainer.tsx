import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { MeaningfulPaintHeader } from "@web-speed-hackathon-2026/client/src/components/foundation/MeaningfulPaintHeader";
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
      <div>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
        <MeaningfulPaintHeader title="投稿" />
        <p aria-busy="true" className="text-cax-text-muted px-4 py-6 text-center">
          読込中...
        </p>
      </div>
    );
  }

  if (post === null) {
    return (
      <div>
        <MeaningfulPaintHeader title="投稿" />
        <NotFoundContainer />
      </div>
    );
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={comments}>
      <div>
        <Helmet>
          <title>{post.user.name} さんのつぶやき - CaX</title>
        </Helmet>
        <MeaningfulPaintHeader title="投稿" />
        <PostPage comments={comments} post={post} />
      </div>
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};
