import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { Navigation } from "@web-speed-hackathon-2026/client/src/components/application/Navigation";

import { getMeQueryOptions, useSignOut } from "../../auth/hooks";

interface Props {
  children: ReactNode;
}

const NavigationContainer = () => {
  const { data: activeUser } = useSuspenseQuery(getMeQueryOptions());
  const navigate = useNavigate();
  const signOutMutation = useSignOut({
    mutationConfig: {
      onSuccess: () => {
        navigate("/");
      },
    },
  });
  const onLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  return <Navigation activeUser={activeUser} onLogout={onLogout} />;
};

export const AppLayout = ({ children }: Props) => {
  return (
    <div className="relative z-0 flex justify-center font-sans">
      <div className="bg-cax-surface text-cax-text flex min-h-screen max-w-full">
        <aside className="relative z-10">
          <Suspense>
            <NavigationContainer />
          </Suspense>
        </aside>
        <main className="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};
