import { CommentList } from "@web-speed-hackathon-2026/client/src/components/post/CommentList";
import { PostItem } from "@web-speed-hackathon-2026/client/src/components/post/PostItem";

interface Props {
  comments: Models.Comment[];
  isLoadingComments: boolean;
  post: Models.Post;
}

export const PostPage = ({ comments, isLoadingComments, post }: Props) => {
  return (
    <>
      <PostItem post={post} />
      {isLoadingComments && comments.length === 0 ? (
        <div style={{ padding: "16px", textAlign: "center" }}>読込中</div>
      ) : (
        <CommentList comments={comments} />
      )}
    </>
  );
};
