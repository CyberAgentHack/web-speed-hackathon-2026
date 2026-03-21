import { useEffect, useState } from "react";

import { CommentList } from "@web-speed-hackathon-2026/client/src/components/post/CommentList";
import { PostItem } from "@web-speed-hackathon-2026/client/src/components/post/PostItem";

interface Props {
  comments: Models.Comment[];
  post: Models.Post;
}

export const PostPage = ({ comments, post }: Props) => {
  const [isCommentListVisible, setIsCommentListVisible] = useState(false);

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      setIsCommentListVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [comments.length, post.id]);

  return (
    <>
      <PostItem post={post} />
      {isCommentListVisible ? <CommentList comments={comments} /> : null}
    </>
  );
};
