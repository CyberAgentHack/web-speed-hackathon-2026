import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
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
    return (
      <>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
        <div className="bg-cax-canvas min-h-screen p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-stone-200 rounded-full w-16" />
            <div className="h-4 bg-stone-200 rounded w-1/3" />
            <div className="h-4 bg-stone-200 rounded w-full" />
          </div>
        </div>
      </>
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
