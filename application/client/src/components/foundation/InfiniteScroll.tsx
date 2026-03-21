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

      console.log("Reached", target.target);
      if(latestItem !== undefined) {
        return fetchMore();
      }
    }

    const observer = new IntersectionObserver(handleReach, {
      rootMargin: "32px",
    });
    console.log("Connecting");
    observer.observe(lastRef.current);
    return () => {
      console.log("Disconnected");
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
