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
        <div className="px-4 pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-cax-surface-subtle h-20 w-20 rounded-full" />
            <div>
              <div className="bg-cax-surface-subtle h-5 w-32 rounded" />
              <div className="bg-cax-surface-subtle mt-2 h-4 w-20 rounded" />
            </div>
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
