import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/foundation/PageTitle";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const UserProfileContainer = () => {
  const { username } = useParams();

  const { data: user, isLoading: isLoadingUser } = useFetch<Models.User>(
    `/api/v1/users/${username}`,
    fetchJSON,
  );
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    `/api/v1/users/${username}/posts`,
    fetchJSON,
  );

  if (isLoadingUser) {
    return <PageTitle title="読込中 - CaX" />;
  }

  if (user === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <PageTitle title={`${user.name} さんのタイムライン - CaX`} />
      <UserProfilePage timeline={posts} user={user} />
    </InfiniteScroll>
  );
};
