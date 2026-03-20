import { useRef } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { getSSRData } from "@web-speed-hackathon-2026/client/src/api/ssr-data";
import { createInfiniteKey, swrFetcher } from "@web-speed-hackathon-2026/client/src/api/swr";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { UserProfilePage } from "@web-speed-hackathon-2026/client/src/components/user_profile/UserProfilePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";

export const UserProfileContainer = () => {
  const { username } = useParams();
  const ssrRef = useRef(getSSRData());
  const ssrUser = ssrRef.current?.user;
  const ssrUserPosts = ssrRef.current?.userPosts;

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

  const posts = data ? data.flat() : [];
  const hasMore = data ? (data[data.length - 1]?.length ?? 0) >= PAGE_SIZE : true;

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
    <InfiniteScroll
      fetchMore={() => setSize((s) => s + 1)}
      items={posts}
      hasMore={hasMore}
      isLoading={isValidating}
    >
      <Helmet>
        <title>{user!.name} さんのタイムライン - CaX</title>
      </Helmet>
      <UserProfilePage timeline={posts} user={user!} />
    </InfiniteScroll>
  );
};
