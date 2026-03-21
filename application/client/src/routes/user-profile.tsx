import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";
import { getLoaderContext } from "@web-speed-hackathon-2026/client/src/utils/server_fetch";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams } from "react-router";

export async function loader({ context, params }: LoaderFunctionArgs) {
	const ctx = getLoaderContext(context);
	const { username } = params;
	const [user, posts] = await Promise.all([
		ctx.getUser(username!) as Promise<Models.User | null>,
		ctx.getUserPosts(username!, 30, 0) as Promise<Models.Post[]>,
	]);
	return { user, posts };
}

export default function UserProfile() {
	const { username } = useParams();
	const { user, posts: initialPosts } = useLoaderData<typeof loader>();

	const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
		`/api/v1/users/${username}/posts`,
		fetchJSON,
		initialPosts,
	);

	if (user === null) {
		return <NotFoundContainer />;
	}

	const lcpImage = getProfileImagePath(user.profileImage.id);

	return (
		<InfiniteScroll fetchMore={fetchMore} items={posts}>
			<title>{`${user.name} さんのタイムライン - CaX`}</title>
			<link rel="preload" as="image" href={lcpImage} />
			<UserProfilePage timeline={posts} user={user} />
		</InfiniteScroll>
	);
}
