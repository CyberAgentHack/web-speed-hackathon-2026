import { createFileRoute } from "@tanstack/react-router";
import { TermContainer } from "../../containers/TermContainer";

export const Route = createFileRoute("/_layout/terms")({
  component: RouteComponent,
});

function RouteComponent() {
  return <TermContainer />;
}
