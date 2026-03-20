import {
  queryOptions,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchJSON, sendJSON } from "../utils/fetchers";

import { AuthFormData } from "./types";

const getMeQueryOptions = () =>
  queryOptions({
    queryKey: ["v1", "me"],
    queryFn: async () => {
      return await fetchJSON<Models.User>("/api/v1/me");
    },
  });

const signUp = async (params: AuthFormData) => {
  return await sendJSON<Models.User>("/api/v1/signup", params);
};

type MutationConfig<MutationFn extends (...args: any) => any> = Omit<
  UseMutationOptions<Awaited<ReturnType<MutationFn>>, Error, Parameters<MutationFn>[0]>,
  "mutationFn"
>;

const useSignUp = ({ mutationConfig }: { mutationConfig?: MutationConfig<typeof signUp> } = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restMutationConfig } = mutationConfig ?? {};
  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getMeQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restMutationConfig,
    mutationFn: signUp,
  });
};

const signIn = async (params: AuthFormData) => {
  return await sendJSON<Models.User>("/api/v1/signin", params);
};

const useSignIn = ({ mutationConfig }: { mutationConfig?: MutationConfig<typeof signIn> } = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restMutationConfig } = mutationConfig ?? {};
  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getMeQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restMutationConfig,
    mutationFn: signIn,
  });
};

const signOut = async () => {
  await sendJSON("/api/v1/signout", {});
};

const useSignOut = ({
  mutationConfig,
}: {
  mutationConfig?: Omit<UseMutationOptions<void, Error>, "mutationFn">;
} = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restMutationConfig } = mutationConfig ?? {};
  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getMeQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restMutationConfig,
    mutationFn: signOut,
  });
};

export { getMeQueryOptions, useSignUp, useSignIn, useSignOut };
