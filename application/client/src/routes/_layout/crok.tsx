import { createFileRoute } from "@tanstack/react-router";
import { CrokContainer } from "../../containers/CrokContainer";
import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "../../query/auth";

export const Route = createFileRoute("/_layout/crok")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: activeUser } = useQuery(authQueryOptions);

  return <CrokContainer activeUser={activeUser ?? null} />;
}
