import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { Pagination, useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { useCallback } from "react";

export const UserProfileContainer = () => {
  const { username } = useParams();

  const { data: user, isLoading: isLoadingUser } = useFetch<Models.User>(
    `/api/v1/users/${username}`,
    fetchJSON,
  );

  const fetchPosts = useCallback((page: Pagination) => {
    return fetchJSON<Models.Post[]>(`/api/v1/users/${username}/posts`, page)
  }, [username]);
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(fetchPosts);

  if (isLoadingUser) {
    return (
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
    );
  }

  if (user === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <Helmet>
        <title>{user.name} さんのタイムライン - CaX</title>
      </Helmet>
      <UserProfilePage timeline={posts} user={user} />
    </InfiniteScroll>
  );
};
