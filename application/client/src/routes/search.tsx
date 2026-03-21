import { SearchPage } from "@web-speed-hackathon-2026/client/src/components/application/SearchPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getImagePath, getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";
import { getLoaderContext } from "@web-speed-hackathon-2026/client/src/utils/server_fetch";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
	const ctx = getLoaderContext(context);
	const url = new URL(request.url);
	const query = url.searchParams.get("q") || "";
	if (!query) {
		return { posts: [] as Models.Post[], query };
	}
	const posts = await ctx.searchPosts(query, 30, 0) as Models.Post[];
	return { posts, query };
}

function SearchContent({ query, initialPosts }: { query: string; initialPosts: Models.Post[] }) {
	const apiPath = query ? `/api/v1/search?q=${encodeURIComponent(query)}` : "";

	const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
		apiPath,
		fetchJSON,
		initialPosts,
	);

	const firstPost = initialPosts[0];
	const lcpImage = firstPost?.images?.length > 0
		? getImagePath(firstPost.images[0]!.id)
		: firstPost ? getProfileImagePath(firstPost.user.profileImage.id) : null;

	return (
		<InfiniteScroll fetchMore={fetchMore} items={posts}>
			<title>検索 - CaX</title>
			{lcpImage && <link rel="preload" as="image" href={lcpImage} />}
			<SearchPage query={query} results={posts} />
		</InfiniteScroll>
	);
}

export default function Search() {
	const { posts: initialPosts, query: initialQuery } = useLoaderData<typeof loader>();
	const [searchParams] = useSearchParams();
	const query = searchParams.get("q") || "";

	const isClientNavigation = query !== initialQuery;

	return (
		<SearchContent
			key={query}
			query={query}
			initialPosts={isClientNavigation ? [] : initialPosts}
		/>
	);
}
