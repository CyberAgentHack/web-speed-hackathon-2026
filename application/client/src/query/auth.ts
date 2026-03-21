import { queryOptions } from "@tanstack/react-query";

export const authQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const result = await fetch("/api/v1/me");
    if (!result.ok) {
      return null;
    }
    const user = (await result.json()) as Models.User;
    return user;
  },
});
