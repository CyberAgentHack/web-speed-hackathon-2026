import { createFileRoute } from "@tanstack/react-router";
import { PostContainer } from "../../containers/PostContainer";

export const Route = createFileRoute("/_layout/posts/$postId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { postId } = Route.useParams();

  return <PostContainer postId={postId} />;
}
