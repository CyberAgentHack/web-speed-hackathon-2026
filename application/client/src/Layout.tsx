import { lazy, Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router";

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

export const Layout = () => {
  return (
    <Suspense fallback={<title>読込中 - CaX</title>}>
      <ScrollRestoration />
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
