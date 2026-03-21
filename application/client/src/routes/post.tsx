import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getImagePath, getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";
import { getLoaderContext } from "@web-speed-hackathon-2026/client/src/utils/server_fetch";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useParams } from "react-router";

export async function loader({ context, params }: LoaderFunctionArgs) {
	const ctx = getLoaderContext(context);
	const { postId } = params;
	const [post, comments] = await Promise.all([
		ctx.getPost(postId!) as Promise<Models.Post | null>,
		ctx.getComments(postId!, 30, 0) as Promise<Models.Comment[]>,
	]);
	return { post, comments };
}

function PostContent({ postId }: { postId: string | undefined }) {
	const { post, comments: initialComments } = useLoaderData<typeof loader>();

	const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
		`/api/v1/posts/${postId}/comments`,
		fetchJSON,
		initialComments,
	);

	if (post === null) {
		return <NotFoundContainer />;
	}

	const lcpImage = post.images?.length > 0
		? getImagePath(post.images[0]!.id)
		: getProfileImagePath(post.user.profileImage.id);

	return (
		<InfiniteScroll fetchMore={fetchMore} items={comments}>
			<title>{`${post.user.name} さんのつぶやき - CaX`}</title>
			<link rel="preload" as="image" href={lcpImage} />
			<PostPage comments={comments} post={post} />
		</InfiniteScroll>
	);
}

export default function Post() {
	const { postId } = useParams();
	return <PostContent key={postId} postId={postId} />;
}
