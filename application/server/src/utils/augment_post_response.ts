import { getSoundWaveform } from "@web-speed-hackathon-2026/server/src/utils/sound_waveform";

interface PostWithOptionalSound {
  toJSON(): Record<string, unknown>;
}

type JsonPost = Record<string, unknown> & {
  sound?: (Record<string, unknown> & { id?: string }) | null;
};

async function augmentPost(
  post: PostWithOptionalSound,
): Promise<JsonPost> {
  const jsonPost = post.toJSON() as JsonPost;
  const sound = jsonPost.sound;

  if (
    sound?.id != null &&
    typeof sound.id === "string" &&
    Array.isArray(sound["waveform"]) === false
  ) {
    sound["waveform"] = await getSoundWaveform(sound.id).catch(() => []);
  }

  return jsonPost;
}

export async function augmentPostsResponse(posts: PostWithOptionalSound[]): Promise<JsonPost[]> {
  return await Promise.all(posts.map((post) => augmentPost(post)));
}

export async function augmentPostResponse(post: PostWithOptionalSound): Promise<JsonPost> {
  return await augmentPost(post);
}
