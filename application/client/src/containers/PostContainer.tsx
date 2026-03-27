import { useContext } from "react";

import { CommentSection } from "@web-speed-hackathon-2026/client/src/components/post/CommentSection";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";

interface Props {
  postId?: string;
}

export const PostContainer = ({ postId }: Props) => {
  const ssrData = useContext(SSRDataContext);
  const post = (ssrData?.[`/api/v1/posts/${postId}`] ?? null) as Models.Post | null;

  useTitle(post ? `${post.user.name} さんのつぶやき - CaX` : "CaX");

  if (post === null) {
    return <NotFoundContainer />;
  }

  return (
    <PostPage post={post}>
      <CommentSection postId={postId!} />
    </PostPage>
  );
};
