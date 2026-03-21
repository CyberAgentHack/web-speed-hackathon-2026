import { useEffect } from "react";
import { useParams } from "react-router";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { useSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-context";
import { createInfiniteKey, swrFetcher } from "@web-speed-hackathon-2026/client/src/api/swr";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";

export const UserProfileContainer = () => {
  const { username } = useParams();
  const ssrData = useSSRData();
  const ssrUser = ssrData?.user;
  const ssrUserPosts = ssrData?.userPosts;

  const { data: user, isLoading: isLoadingUser } = useSWR<Models.User | null, Error, string>(
    `/api/v1/users/${username}`,
    swrFetcher,
    ssrUser !== undefined
      ? { fallbackData: ssrUser as Models.User | null, revalidateOnMount: false }
      : undefined,
  );

  const PAGE_SIZE = 30;
  const getKey = createInfiniteKey(`/api/v1/users/${username}/posts`);
  const { data, setSize, isValidating } = useSWRInfinite<Models.Post[]>(getKey, {
    revalidateFirstPage: false,
    ...(ssrUserPosts ? { fallbackData: [ssrUserPosts], revalidateOnMount: false } : {}),
  });

  const posts = data ? data.flat() : (ssrUserPosts ?? []);
  const hasMore = data ? (data[data.length - 1]?.length ?? 0) >= PAGE_SIZE : true;

  useEffect(() => {
    if (user) {
      document.title = `${user.name} さんのタイムライン - CaX`;
    }
  }, [user]);

  if (isLoadingUser) {
    return <title>読込中 - CaX</title>;
  }

  if (user === null) {
    return <NotFoundContainer />;
  }

  return (
    <InfiniteScroll
      fetchMore={() => setSize((s) => s + 1)}
      items={posts}
      hasMore={hasMore}
      isLoading={isValidating}
    >
      <UserProfilePage timeline={posts} user={user!} />
    </InfiniteScroll>
  );
};
