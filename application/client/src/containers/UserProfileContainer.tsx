import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";

interface UserProfileContainerProps {
  ssrUser?: Models.User | null | undefined;
  ssrPosts?: Models.Post[] | undefined;
}

export const UserProfileContainer = ({ ssrUser, ssrPosts }: UserProfileContainerProps) => {
  const { username } = useParams();

  const { data: user, isLoading: isLoadingUser } = useFetch<Models.User>(
    `/api/v1/users/${username}`,
    () =>
      apiClient.users[":username"]
        .$get({ param: { username: username! } })
        .then((res) => res.json()),
    ssrUser,
  );
  const { data: posts, fetchMore } = useInfiniteFetch<Models.Post>(
    `/api/v1/users/${username}/posts`,
    () =>
      apiClient.users[":username"].posts
        .$get({ param: { username: username! } })
        .then((res) => res.json()),
    ssrPosts,
  );

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
