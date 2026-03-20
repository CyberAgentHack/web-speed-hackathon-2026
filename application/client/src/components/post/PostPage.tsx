import { CommentList } from "@web-speed-hackathon-2026/client/src/components/post/CommentList";
import { PostItem } from "@web-speed-hackathon-2026/client/src/components/post/PostItem";

interface Props {
  comments: Models.Comment[];
  post: Models.Post;
}

export const PostPage = ({ comments, post }: Props) => {
  return (
    <>
      <PostItem post={post} isFirstPost={true} />
      <CommentList comments={comments} />
    </>
  );
};
