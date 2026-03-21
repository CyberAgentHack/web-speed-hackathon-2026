import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppPage } from "../components/application/AppPage";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppPage>
      <Outlet />
    </AppPage>
  );
}
