import { createFileRoute } from "@tanstack/react-router";
import { SearchContainer } from "../../containers/SearchContainer";

export const Route = createFileRoute("/_layout/search")({
  component: RouteComponent,
  validateSearch: (search) => {
    const q = search["q"];
    if (typeof q !== "string") {
      return {};
    }
    return {
      q,
    };
  },
  loaderDeps: ({ search }) => ({ q: search["q"] }),
});

function RouteComponent() {
  const { q } = Route.useLoaderDeps();
  return <SearchContainer query={q} />;
}
