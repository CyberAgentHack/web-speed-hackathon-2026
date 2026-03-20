// FIXME: defensive programming

import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItem = items[items.length - 1];

  const lastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(lastRef.current === null) {
      return;
    }

    const handleReach = (targetsList: IntersectionObserverEntry[]) => {
      const target = targetsList[0];
      if(target == null || targetsList.length !== 1) {
        console.info(targetsList);
        throw new Error("Expected to only receive one dir div[ref=lastRef] but it wasn't");
      }

      if(!target.isIntersecting) {
        return;
      }

      console.log("Reached");
      if(latestItem !== undefined) {
        return fetchMore();
      }
    }

    const observer = new IntersectionObserver(handleReach);
    observer.observe(lastRef.current);
    return () => {
      observer.disconnect();
    };
  }, [latestItem, fetchMore]);

  return (
    <div>
      {children}
      <div ref={lastRef} />
    </div>
  );
};
