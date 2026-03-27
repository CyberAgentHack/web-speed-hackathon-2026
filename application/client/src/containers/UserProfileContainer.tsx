import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  username?: string;
}

export const UserProfileContainer = ({ username }: Props) => {
  const { data: user, isLoading: isLoadingUser } = useFetch<Models.User>(
    `/api/v1/users/${username}`,
    fetchJSON,
  );
  const { data: posts, fetchMore, hasMore } = useInfiniteFetch<Models.Post>(
    `/api/v1/users/${username}/posts`,
    fetchJSON,
  );

  useTitle(isLoadingUser ? "読込中 - CaX" : user != null ? `${user.name} さんのタイムライン - CaX` : "ページが見つかりません - CaX");

  if (isLoadingUser) {
    return null;
  }

  if (user === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={posts}>
      <UserProfilePage timeline={posts} user={user} />
    </InfiniteScroll>
  );
};
