import { layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	layout("routes/layout.tsx", [
		route("/", "routes/timeline.tsx"),
		route("/posts/:postId", "routes/post.tsx"),
		route("/users/:username", "routes/user-profile.tsx"),
		route("/search", "routes/search.tsx"),
		route("/dm", "routes/dm-list.tsx"),
		route("/dm/:conversationId", "routes/dm.tsx"),
		route("/terms", "routes/terms.tsx"),
		route("/crok", "routes/crok.tsx"),
		route("*", "routes/not-found.tsx"),
	]),
] satisfies RouteConfig;
