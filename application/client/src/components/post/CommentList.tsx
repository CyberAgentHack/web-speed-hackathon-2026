import { CommentItem } from "@web-speed-hackathon-2026/client/src/components/post/CommentItem";

interface Props {
  comments: Models.Comment[];
}

export const CommentList = ({ comments }: Props) => {
  return (
    <div>
      {comments.map((comment, index) => {
        return <CommentItem key={comment.id} comment={comment} index={index} />;
      })}
    </div>
  );
};
