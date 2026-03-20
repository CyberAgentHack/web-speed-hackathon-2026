import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";

const Navigation = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/components/application/Navigation");
  return { default: module.Navigation };
});

interface Props {
  activeUser: Models.User | null;
  children: ReactNode;
  isLoadingActiveUser: boolean;
  onOpenAuthModal: () => void;
  onOpenNewPostModal: () => void;
  onLogout: () => void;
}

export const AppPage = ({
  activeUser,
  children,
  isLoadingActiveUser,
  onOpenAuthModal,
  onOpenNewPostModal,
  onLogout,
}: Props) => {
  const [shouldLoadNavigation, setShouldLoadNavigation] = useState(false);

  useEffect(() => {
    const idleWindow = window as Window & {
      cancelIdleCallback?: (id: number) => void;
      requestIdleCallback?: (callback: () => void) => number;
    };
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const scheduleNavigationLoad = () => {
      setShouldLoadNavigation(true);
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(scheduleNavigationLoad);
    } else {
      timeoutId = window.setTimeout(scheduleNavigationLoad, 1);
    }

    return () => {
      if (idleId !== null) {
        idleWindow.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="relative z-0 flex justify-center font-sans">
      <div className="bg-cax-surface text-cax-text flex min-h-screen max-w-full">
        <aside className="relative z-10">
          <Suspense fallback={<NavigationSkeleton />}>
            {shouldLoadNavigation ? (
              <Navigation
                activeUser={activeUser}
                isLoadingActiveUser={isLoadingActiveUser}
                onOpenAuthModal={onOpenAuthModal}
                onOpenNewPostModal={onOpenNewPostModal}
                onLogout={onLogout}
              />
            ) : (
              <NavigationSkeleton />
            )}
          </Suspense>
        </aside>
        <main className="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};

const NavigationSkeleton = () => {
  return (
    <nav
      aria-hidden="true"
      className="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r"
    >
      <div className="relative grid h-full grid-flow-col items-center justify-evenly px-4 lg:fixed lg:flex lg:h-full lg:w-48 lg:flex-col lg:justify-start lg:gap-2 lg:p-2">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className="bg-cax-surface-subtle h-7 w-7 rounded-full lg:h-12 lg:w-full lg:rounded-full"
          />
        ))}
      </div>
    </nav>
  );
};
