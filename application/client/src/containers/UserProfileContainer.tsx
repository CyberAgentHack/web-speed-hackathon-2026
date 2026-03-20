import { useEffect } from "react";
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

  useEffect(() => {
    if (isLoadingUser) {
      document.title = "読込中 - CaX";
    } else if (user !== null) {
      document.title = `${user.name} さんのタイムライン - CaX`;
    }
  }, [isLoadingUser, user]);

  if (isLoadingUser) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-20 w-20 rounded-full bg-cax-surface-subtle" />
          <div className="flex-1">
            <div className="h-5 w-32 rounded bg-cax-surface-subtle mb-2" />
            <div className="h-3 w-20 rounded bg-cax-surface-subtle" />
          </div>
        </div>
        <div className="h-4 w-full rounded bg-cax-surface-subtle mb-2" />
        <div className="h-4 w-2/3 rounded bg-cax-surface-subtle" />
      </div>
    );
  }

  if (user === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} items={posts}>
      <UserProfilePage timeline={posts} user={user} />
    </InfiniteScroll>
  );
};
