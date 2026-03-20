import type { ReactNode } from "react";

import { Navigation } from "@web-speed-hackathon-2026/client/src/components/application/Navigation";

interface Props {
  activeUser: Models.User | null;
  children: ReactNode;
  onLogout: () => void;
}

export const AppPage = ({ activeUser, children, onLogout }: Props) => {
  return (
    <div className="relative z-0 flex justify-center font-sans">
      <div className="bg-cax-surface text-cax-text flex min-h-screen max-w-full">
        <aside className="relative z-10">
          <Navigation
            activeUser={activeUser}
            onLogout={onLogout}
          />
        </aside>
        <main className="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};
