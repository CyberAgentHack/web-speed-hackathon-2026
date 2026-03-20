import { PostItem } from "@web-speed-hackathon-2026/client/src/components/post/PostItem";

interface Props {
  post: Models.Post;
}

export const PostPage = ({ post }: Props) => {
  return (
    <>
      <PostItem post={post} prioritizeMedia />
    </>
  );
};
