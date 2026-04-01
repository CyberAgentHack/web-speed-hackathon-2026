import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const UserProfileContainer = () => {
  const { username } = useParams();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["v1", "users", username],
    queryFn: () => fetchJSON<Models.User>(`/api/v1/users/${username}`),
  });
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    `/api/v1/users/${username}/posts`,
  );

  if (isLoadingUser) {
    return <title>読込中 - CaX</title>;
  }

  if (!user) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <title>{`${user.name} さんのタイムライン - CaX`}</title>
      <UserProfilePage timeline={posts} user={user} />
    </InfiniteScroll>
  );
};
