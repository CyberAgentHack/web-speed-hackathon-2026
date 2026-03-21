import { createFileRoute } from "@tanstack/react-router";
import { DirectMessageContainer } from "../../containers/DirectMessageContainer";
import { useQuery } from "@tanstack/react-query";
import { authQueryOptions } from "../../query/auth";

export const Route = createFileRoute("/_layout/dm/$conversationId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { conversationId } = Route.useParams();
  const { data: activeUser } = useQuery(authQueryOptions);

  return (
    <DirectMessageContainer
      conversationId={conversationId}
      activeUser={activeUser ?? null}
    />
  );
}
