import { useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { getMeQueryOptions, useSignOut } from "@web-speed-hackathon-2026/client/src/auth/hooks";
import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";

const AuthModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/AuthModalContainer").then((module) => ({
    default: module.AuthModalContainer,
  })),
);
const NewPostModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer").then(
    (module) => ({
      default: module.NewPostModalContainer,
    }),
  ),
);

export const AppLayoutContainer = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const navigate = useNavigate();
  const { data: activeUser } = useSuspenseQuery(getMeQueryOptions());

  const signOutMutation = useSignOut({
    mutationConfig: {
      onSuccess: () => {
        navigate("/");
      },
    },
  });
  const handleLogout = async () => {
    await signOutMutation.mutateAsync();
  };

  return (
    <Suspense fallback={<title>読込中 - CaX</title>}>
      <AppPage activeUser={activeUser} onLogout={handleLogout}>
        <Outlet />
      </AppPage>

      <Suspense>
        <AuthModalContainer />
      </Suspense>
      <Suspense>
        <NewPostModalContainer />
      </Suspense>
    </Suspense>
  );
};
