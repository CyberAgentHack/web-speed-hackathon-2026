import { useEffect, useState } from "react";
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
  const [isCommentsEnabled, setIsCommentsEnabled] = useState(false);

  useEffect(() => {
    setIsCommentsEnabled(false);
  }, [postId]);

  useEffect(() => {
    if (post == null) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsCommentsEnabled(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [post]);

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    isCommentsEnabled ? `/api/v1/posts/${postId}/comments` : "",
    fetchJSON,
    10,
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

  const content = (
    <>
      <Helmet>
        <title>{post.user.name} さんのつぶやき - CaX</title>
      </Helmet>
      <PostPage comments={comments} post={post} />
    </>
  );

  return isCommentsEnabled ? (
    <InfiniteScroll fetchMore={fetchMore} items={comments}>
      {content}
    </InfiniteScroll>
  ) : (
    content
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};
