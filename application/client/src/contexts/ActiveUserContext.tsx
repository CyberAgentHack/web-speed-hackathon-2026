import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { User as ApiUser } from "@web-speed-hackathon-2026/client/src/api/generated/model";

import {
  getCurrentUser,
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
} from "@web-speed-hackathon-2026/client/src/api/generated/users/users";

export { getGetCurrentUserQueryKey as getActiveUserQueryKey };

export type ActiveUserContextValue = {
  activeUser: Models.User | null;
  isLoading: boolean;
  setActiveUser: Dispatch<SetStateAction<Models.User | null>>;
};

const ActiveUserContext = createContext<ActiveUserContextValue | null>(null);

type CurrentUserQueryData = Awaited<ReturnType<typeof getCurrentUser>>;

function cacheForActiveUser(user: Models.User | null): CurrentUserQueryData {
  if (user === null) {
    return { status: 401, data: {}, headers: new Headers() };
  }
  return {
    status: 200,
    data: user as unknown as ApiUser,
    headers: new Headers(),
  } as CurrentUserQueryData;
}

function selectActiveUser(response: CurrentUserQueryData): Models.User | null {
  return response.status === 200 ? (response.data as Models.User) : null;
}

export function ActiveUserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isPending } = useGetCurrentUser({
    query: {
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: Number.POSITIVE_INFINITY,
      refetchOnReconnect: false,
      select: selectActiveUser,
    },
  });

  const setActiveUser = useCallback(
    (next: SetStateAction<Models.User | null>) => {
      queryClient.setQueryData<CurrentUserQueryData>(getGetCurrentUserQueryKey(), (prev) => {
        const prevUser = prev !== undefined && prev.status === 200 ? (prev.data as Models.User) : null;
        const nextUser =
          typeof next === "function"
            ? (next as (p: Models.User | null) => Models.User | null)(prevUser)
            : next;
        return cacheForActiveUser(nextUser);
      });
    },
    [queryClient],
  );

  const value = useMemo(
    (): ActiveUserContextValue => ({
      activeUser: data === undefined ? null : data,
      isLoading: isPending,
      setActiveUser,
    }),
    [data, isPending, setActiveUser],
  );

  return <ActiveUserContext.Provider value={value}>{children}</ActiveUserContext.Provider>;
}

export function useActiveUser(): ActiveUserContextValue {
  const ctx = useContext(ActiveUserContext);
  if (ctx === null) {
    throw new Error("useActiveUser must be used within ActiveUserProvider");
  }
  return ctx;
}
