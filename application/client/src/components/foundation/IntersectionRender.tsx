import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  height?: string | number;
}

export const IntersectionRender = ({ children, height = "200px" }: Props) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // 200px手前でレンダリング開始
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {isIntersecting ? children : null}
    </div>
  );
};
