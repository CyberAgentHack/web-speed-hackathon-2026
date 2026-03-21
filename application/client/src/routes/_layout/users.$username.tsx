import { createFileRoute } from "@tanstack/react-router";
import { UserProfileContainer } from "../../containers/UserProfileContainer";

export const Route = createFileRoute("/_layout/users/$username")({
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  return <UserProfileContainer username={username} />;
}
