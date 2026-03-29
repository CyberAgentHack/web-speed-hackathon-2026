import { resolveMovieExtension } from "@web-speed-hackathon-2026/server/src/utils/movie_file";

type SerializedMovie = {
  extension?: string;
  id: string;
  [key: string]: unknown;
};

type SerializedPost = {
  movie?: SerializedMovie | null;
  [key: string]: unknown;
};

function toPlainPost(post: unknown): SerializedPost {
  if (typeof post === "object" && post !== null && "toJSON" in post && typeof post.toJSON === "function") {
    return post.toJSON() as SerializedPost;
  }

  return post as SerializedPost;
}

export function serializePost(post: unknown): SerializedPost {
  const plainPost = toPlainPost(post);

  if (plainPost.movie != null) {
    const extension = resolveMovieExtension(plainPost.movie.id);
    if (extension !== null) {
      plainPost.movie = {
        ...plainPost.movie,
        extension,
      };
    }
  }

  return plainPost;
}

export function serializePosts(posts: unknown[]): SerializedPost[] {
  return posts.map((post) => serializePost(post));
}
