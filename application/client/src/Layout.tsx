import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { getMeQueryOptions, useSignOut } from "@web-speed-hackathon-2026/client/src/auth/hooks";
import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";

import { AuthModalContainer } from "./containers/AuthModalContainer";
import { NewPostModalContainer } from "./containers/NewPostModalContainer";

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

      <AuthModalContainer />
      <NewPostModalContainer />
    </Suspense>
  );
};
