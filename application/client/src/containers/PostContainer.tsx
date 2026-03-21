import { startTransition, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { PostCommentsSection } from "@web-speed-hackathon-2026/client/src/components/post/PostCommentsSection";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON, fetchPreloadedJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (
    callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
    options?: { timeout: number },
  ) => number;
};

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchPreloadedJSON,
  );
  const [shouldLoadComments, setShouldLoadComments] = useState(false);

  const {
    data: comments,
    fetchMore,
    hasMore,
    isLoading,
  } = useInfiniteFetch<Models.Comment>(`/api/v1/posts/${postId}/comments`, fetchJSON, {
    enabled: shouldLoadComments,
  });

  useEffect(() => {
    setShouldLoadComments(false);
  }, [postId]);

  useEffect(() => {
    if (post == null) {
      return;
    }

    const idleWindow = window as IdleWindow;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const enableComments = () => {
      startTransition(() => {
        setShouldLoadComments(true);
      });
    };

    if (idleWindow.requestIdleCallback != null) {
      idleId = idleWindow.requestIdleCallback(() => {
        enableComments();
      }, { timeout: 1000 });
    } else {
      timeoutId = window.setTimeout(() => {
        enableComments();
      }, 250);
    }

    return () => {
      if (idleId != null && idleWindow.cancelIdleCallback != null) {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [post]);

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
    <>
      <Helmet>
        <title>{post.user.name} さんのつぶやき - CaX</title>
      </Helmet>
      <PostPage post={post} />
      <PostCommentsSection
        comments={comments}
        fetchMore={fetchMore}
        hasMore={hasMore}
        isLoading={isLoading}
        shouldRender={shouldLoadComments}
      />
    </>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};
