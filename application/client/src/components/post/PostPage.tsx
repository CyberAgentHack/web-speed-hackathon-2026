import type { ReactNode } from "react";

import { PostItem } from "@web-speed-hackathon-2026/client/src/components/post/PostItem";

interface Props {
  post: Models.Post;
  children?: ReactNode;
}

export const PostPage = ({ post, children }: Props) => {
  return (
    <>
      <PostItem post={post} />
      {children}
    </>
  );
};
