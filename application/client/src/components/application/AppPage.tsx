import type { ReactNode } from "react";

import { Navigation } from "@web-speed-hackathon-2026/client/src/components/application/Navigation";

interface Props {
  activeUser: Models.User | null;
  children: ReactNode;
  authModalId: string;
  newPostModalId: string;
  onLogout: () => void;
  onPreloadCrok?: () => void;
}

export const AppPage = ({
  activeUser,
  children,
  authModalId,
  newPostModalId,
  onLogout,
  onPreloadCrok,
}: Props) => {
  return (
    <div className="app-shell relative z-0 flex justify-center font-sans">
      <div className="app-frame bg-cax-surface text-cax-text flex min-h-screen max-w-full">
        <aside className="border-cax-border relative z-10 lg:border-r">
          <Navigation
            activeUser={activeUser}
            authModalId={authModalId}
            newPostModalId={newPostModalId}
            onLogout={onLogout}
            onPreloadCrok={onPreloadCrok}
          />
        </aside>
        <main className="app-main relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};
