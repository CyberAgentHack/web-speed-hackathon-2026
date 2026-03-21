import { createFileRoute } from "@tanstack/react-router";
import { TimelineContainer } from "../../containers/TimelineContainer";

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <TimelineContainer />;
}
