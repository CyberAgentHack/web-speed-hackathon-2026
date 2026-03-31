import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  placeholder?: ReactNode;
}

export const DeferredMount = ({ children, className, placeholder = null }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const element = ref.current;
    if (element == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "400px 0px",
      },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  return <div ref={ref} className={className}>{isVisible ? children : placeholder}</div>;
};
