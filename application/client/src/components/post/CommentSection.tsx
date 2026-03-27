import { CommentList } from "@web-speed-hackathon-2026/client/src/components/post/CommentList";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  postId: string;
}

export const CommentSection = ({ postId }: Props) => {
  const {
    data: comments,
    fetchMore,
    hasMore,
    isLoading,
  } = useInfiniteFetch<Models.Comment>(`/api/v1/posts/${postId}/comments`, fetchJSON, { initialLimit: 10 });

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex justify-center py-4">
        <span className="text-cax-text-muted animate-spin text-xl">
          <FontAwesomeIcon iconType="circle-notch" styleType="solid" />
        </span>
      </div>
    );
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={comments}>
      <CommentList comments={comments} />
    </InfiniteScroll>
  );
};
