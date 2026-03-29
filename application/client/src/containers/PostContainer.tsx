import { Helmet } from "react-helmet";
import { useParams } from "react-router";
import { useEffect, useState } from "react";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const [shouldLoadComments, setShouldLoadComments] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 0) {
        setShouldLoadComments(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
    { enabled: shouldLoadComments },
  );

  if (isLoadingPost) {
    return (
      <>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
        <section className="px-4 py-6" aria-hidden={true}>
          <div className="bg-cax-surface-subtle h-8 w-2/5 animate-pulse rounded" />
          <div className="bg-cax-surface-subtle mt-3 h-4 w-11/12 animate-pulse rounded" />
          <div className="bg-cax-surface-subtle mt-2 h-4 w-2/3 animate-pulse rounded" />
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
