import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";
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

  const [shouldLoadComments, setShouldLoadComments] = useState(false);

  useEffect(() => {
    if (isLoadingPost || post == null) {
      setShouldLoadComments(false);
      return;
    }

    const loadComments = () => {
      setShouldLoadComments(true);
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadComments, { timeout: 1500 });
      return () => {
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(loadComments, 300);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [isLoadingPost, post]);

  const { data: comments, fetchMore, hasMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
    { enabled: shouldLoadComments, limit: 4 },
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
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={comments}>
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
