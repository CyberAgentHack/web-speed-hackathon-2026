import { lazy, Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import { AppLayout } from "@web-speed-hackathon-2026/client/src/components/application/AppLayout";

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

  return (
    <Suspense fallback={<title>読込中 - CaX</title>}>
      <AppLayout>
        <Outlet />
      </AppLayout>

      <Suspense>
        <AuthModalContainer />
      </Suspense>
      <Suspense>
        <NewPostModalContainer />
      </Suspense>
    </Suspense>
  );
};
