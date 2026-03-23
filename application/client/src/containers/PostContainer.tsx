import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const { data: post } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    postId ? `/api/v1/posts/${postId}/comments` : null,
    fetchJSON,
  );

  // APIレスポンス直後に最初の画像をpreload
  useEffect(() => {
    if (post?.images?.[0]?.id) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = getImagePath(post.images[0].id);
      (link as HTMLLinkElement & { fetchPriority: string }).fetchPriority = "high";
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [post?.images?.[0]?.id]);

  if (post === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={comments}>
      <Helmet>
        <title>{post ? `${post.user.name} さんのつぶやき - CaX` : "読込中 - CaX"}</title>
      </Helmet>
      {post && <PostPage comments={comments} post={post} />}
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};
