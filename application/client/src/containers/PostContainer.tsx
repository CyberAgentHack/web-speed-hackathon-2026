import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
    const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
        `/api/v1/posts/${postId}`,
        fetchJSON,
    );

    const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
        `/api/v1/posts/${postId}/comments`,
        fetchJSON,
    );

    const title = isLoadingPost
        ? "読込中 - CaX"
        : post !== null
          ? `${post.user.name} さんのつぶやき - CaX`
          : null;
    useDocumentTitle(title);

    if (isLoadingPost) {
        return null;
    }

    if (post === null) {
        return <NotFoundContainer />;
    }

    return (
        <InfiniteScroll fetchMore={fetchMore} items={comments}>
            <PostPage comments={comments} post={post} />
        </InfiniteScroll>
    );
};

export const PostContainer = () => {
    const { postId } = useParams();
    return <PostContainerContent key={postId} postId={postId} />;
};
