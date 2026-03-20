import { CommentList } from "@web-speed-hackathon-2026/client/src/components/post/CommentList";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";

interface Props {
  comments: Models.Comment[];
  fetchMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  shouldRender: boolean;
}

export const PostCommentsSection = ({
  comments,
  fetchMore,
  hasMore,
  isLoading,
  shouldRender,
}: Props) => {
  if (!shouldRender && comments.length === 0) {
    return null;
  }

  return (
    <section aria-label="コメント" className="pb-6">
      <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} isLoading={isLoading}>
        {comments.length > 0 ? (
          <CommentList comments={comments} />
        ) : (
          <div className="text-cax-text-muted px-5 py-6 text-sm">コメントを読み込み中...</div>
        )}
      </InfiniteScroll>
    </section>
  );
};
