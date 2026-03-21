import React from "react";
void React;
import { useEffect, useState } from "react";

import { Helmet } from "@web-speed-hackathon-2026/client/src/components/foundation/Helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

function scheduleDeferredTask(task: () => void) {
  if (typeof window !== "undefined") {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let callbackId: number | null = null;
    let disposed = false;

    const scheduleTask = () => {
      if (disposed) {
        return;
      }

      if ("requestIdleCallback" in window) {
        callbackId = window.requestIdleCallback(task, { timeout: 2000 });
        return;
      }

      timeoutId = globalThis.setTimeout(task, 400);
    };

    if (document.readyState === "complete") {
      scheduleTask();
    } else {
      window.addEventListener("load", scheduleTask, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener("load", scheduleTask);
      if (callbackId !== null) {
        window.cancelIdleCallback(callbackId);
      }
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }

  const timeoutId = globalThis.setTimeout(task, 250);
  return () => {
    globalThis.clearTimeout(timeoutId);
  };
}

const PostContainerContent = ({
  initialPost,
  postId,
}: {
  initialPost?: Models.Post;
  postId: string | undefined;
}) => {
  const bootstrappedPost = initialPost?.id === postId ? initialPost : undefined;
  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
    { initialData: bootstrappedPost },
  );
  const [shouldLoadComments, setShouldLoadComments] = useState(bootstrappedPost == null);

  useEffect(() => {
    if (postId == null) {
      setShouldLoadComments(false);
      return;
    }

    if (bootstrappedPost == null) {
      setShouldLoadComments(true);
      return;
    }

    setShouldLoadComments(false);
    return scheduleDeferredTask(() => {
      setShouldLoadComments(true);
    });
  }, [bootstrappedPost, postId]);

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    shouldLoadComments ? `/api/v1/posts/${postId}/comments` : "",
    fetchJSON,
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

export const PostContainer = ({ initialPost }: { initialPost?: Models.Post }) => {
  const { postId } = useParams();
  return <PostContainerContent initialPost={initialPost} key={postId} postId={postId} />;
};
