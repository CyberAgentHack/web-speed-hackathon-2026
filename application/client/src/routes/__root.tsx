import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { NotFoundContainer } from "../containers/NotFoundContainer";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundContainer,
});

function RootComponent() {
  return <Outlet />;
}
