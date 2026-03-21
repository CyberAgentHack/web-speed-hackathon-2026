import { createFileRoute } from "@tanstack/react-router";
import { DirectMessageListContainer } from "../../containers/DirectMessageListContainer";
import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "../../query/auth";

export const Route = createFileRoute("/_layout/dm/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: activeUser } = useQuery(authQueryOptions);

  return <DirectMessageListContainer activeUser={activeUser ?? null} />;
}
