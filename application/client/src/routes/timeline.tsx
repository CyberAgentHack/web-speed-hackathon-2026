import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getImagePath, getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";
import { getLoaderContext } from "@web-speed-hackathon-2026/client/src/utils/server_fetch";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

export async function loader({ context }: LoaderFunctionArgs) {
	const ctx = getLoaderContext(context);
	const posts = await ctx.getPosts(5, 0) as Models.Post[];
	return { posts };
}

export default function Timeline() {
	const { posts: initialPosts } = useLoaderData<typeof loader>();
	const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
		"/api/v1/posts",
		fetchJSON,
		initialPosts,
	);

	const firstPost = initialPosts[0];
	const lcpImage = firstPost?.images?.length > 0
		? getImagePath(firstPost.images[0]!.id)
		: firstPost ? getProfileImagePath(firstPost.user.profileImage.id) : null;

	return (
		<InfiniteScroll fetchMore={fetchMore} items={posts}>
			<title>タイムライン - CaX</title>
			{lcpImage && <link rel="preload" as="image" href={lcpImage} />}
			<TimelinePage timeline={posts} />
		</InfiniteScroll>
	);
}
