export interface LoaderContext {
  getMe: () => Promise<unknown>;
  getPosts: (limit: number, offset: number) => Promise<unknown[]>;
  getPost: (postId: string) => Promise<unknown>;
  getComments: (postId: string, limit: number, offset: number) => Promise<unknown[]>;
  getUser: (username: string) => Promise<unknown>;
  getUserPosts: (username: string, limit: number, offset: number) => Promise<unknown[]>;
  searchPosts: (query: string, limit: number, offset: number) => Promise<unknown[]>;
  getDmConversations: () => Promise<unknown[] | null>;
  getDmConversation: (conversationId: string) => Promise<unknown>;
}

export function getLoaderContext(context: unknown): LoaderContext {
  return context as LoaderContext;
}
