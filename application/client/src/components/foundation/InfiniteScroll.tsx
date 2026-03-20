import InfiniteScrollBase from "react-infinite-scroll-component";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fetchMore: () => void;
  hasMore: boolean;
  items: readonly unknown[];
}

export const InfiniteScroll = ({ children, fetchMore, hasMore, items }: Props) => {
  const length = items.length;

  return (
    <InfiniteScrollBase
      dataLength={length}
      endMessage={
        <p className="text-cax-text-muted py-4 text-center text-sm">すべて表示しました</p>
      }
      hasChildren={length > 0}
      hasMore={hasMore}
      loader={
        <p className="text-cax-text-muted py-4 text-center text-sm">読込中…</p>
      }
      next={fetchMore}
    >
      {children}
    </InfiniteScrollBase>
  );
};
