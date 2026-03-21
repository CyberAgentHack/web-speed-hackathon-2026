import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendFile, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const NewPostModalPage = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage").then(
    (module) => ({
      default: module.NewPostModalPage,
    }),
  ),
);

interface SubmitParams {
  images: Array<{ alt: string; file: File }>;
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

function logNewPost(event: string, payload?: Record<string, unknown>) {
  console.info("[new-post]", event, payload ?? {});
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  logNewPost("submit:start", {
    imageCount: images.length,
    hasMovie: movie != null,
    hasSound: sound != null,
    textLength: text.length,
  });

  const uploadedImages = images.length
    ? await Promise.all(
        images.map(async (image) => {
          logNewPost("imageUpload:start", {
            altLength: image.alt.length,
            size: image.file.size,
            type: image.file.type,
          });
          const uploaded = await sendFile<{ alt: string; id: string }>("/api/v1/images", image.file, {
            "X-Image-Alt": encodeURIComponent(image.alt),
          });
          logNewPost("imageUpload:success", uploaded);
          return uploaded;
        }),
      )
    : [];

  const uploadedMovie = movie
    ? await (async () => {
        logNewPost("movieUpload:start", { name: movie.name, size: movie.size, type: movie.type });
        const uploaded = await sendFile<{ id: string }>("/api/v1/movies", movie);
        logNewPost("movieUpload:success", uploaded);
        return uploaded;
      })()
    : undefined;

  const uploadedSound = sound
    ? await (async () => {
        logNewPost("soundUpload:start", { name: sound.name, size: sound.size, type: sound.type });
        const uploaded = await sendFile<{ id: string }>("/api/v1/sounds", sound);
        logNewPost("soundUpload:success", uploaded);
        return uploaded;
      })()
    : undefined;

  const payload = {
    images: uploadedImages,
    movie: uploadedMovie,
    sound: uploadedSound,
    text,
  };

  logNewPost("postCreate:start", {
    imageCount: uploadedImages.length,
    movieId: uploadedMovie?.id,
    soundId: uploadedSound?.id,
    textLength: text.length,
  });
  const post = await sendJSON<Models.Post>("/api/v1/posts", payload);
  logNewPost("postCreate:success", { postId: post.id });
  return post;
}

interface Props {
  id: string;
}

export const NewPostModalContainer = ({ id }: Props) => {
  const dialogId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    const handleToggle = () => {
      // モーダル開閉時にkeyを更新することでフォームの状態をリセットする
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, []);

  const navigate = useNavigate();

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetError = useCallback(() => {
    setHasError(false);
  }, []);

  const handleSubmit = useCallback(
    async (params: SubmitParams) => {
      try {
        setIsLoading(true);
        const post = await sendNewPost(params);
        ref.current?.close();
        navigate(`/posts/${post.id}`);
      } catch (error) {
        console.error("[new-post] submit:failure", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  return (
    <Modal aria-labelledby={dialogId} id={id} ref={ref} closedby="any">
      <Suspense fallback={<div className="p-4 text-center">読込中...</div>}>
        <NewPostModalPage
          key={resetKey}
          id={dialogId}
          hasError={hasError}
          isLoading={isLoading}
          onResetError={handleResetError}
          onSubmit={handleSubmit}
        />
      </Suspense>
    </Modal>
  );
};
