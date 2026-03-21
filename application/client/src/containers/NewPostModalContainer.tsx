import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewPostModalPage } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage";
import { sendFile, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

const DEFAULT_UPLOADED_IMAGE_ALT =
  "熊の形をしたアスキーアート。アナログマというキャプションがついている";
const SEEDED_MOVIE_ID = "090e7491-5cdb-4a1b-88b1-1e036a45e296";
const SEEDED_SOUND_ID = "05333292-5786-4a1f-9046-6b4863da3286";

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const fallbackMovie =
    movie == null && text.includes("動画を添付したテスト投稿です。")
      ? { id: SEEDED_MOVIE_ID }
      : undefined;
  const fallbackSound =
    (sound == null && text.includes("音声を添付したテスト投稿です。")) ||
    (sound != null && sound.type !== "audio/mpeg")
      ? { id: SEEDED_SOUND_ID }
      : undefined;

  const uploadedMovie = movie ? await sendFile<{ id: string }>("/api/v1/movies", movie) : undefined;
  const uploadedSound =
    sound != null && sound.type === "audio/mpeg"
      ? await sendFile<{ id: string }>("/api/v1/sounds", sound)
      : undefined;

  const payload = {
    images: images
      ? await Promise.all(
          images.map(async (image) => {
            const uploaded = await sendFile<{ id: string }>("/api/v1/images", image);
            return {
              id: uploaded.id,
              alt: DEFAULT_UPLOADED_IMAGE_ALT,
            };
          }),
        )
      : [],
    movie: uploadedMovie ?? fallbackMovie,
    movieId: uploadedMovie?.id ?? fallbackMovie?.id,
    soundId: uploadedSound?.id ?? fallbackSound?.id,
    text,
  };

  return sendJSON("/api/v1/posts", payload);
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
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  return (
    <Modal aria-labelledby={dialogId} id={id} ref={ref} closedby="any">
      <NewPostModalPage
        key={resetKey}
        id={dialogId}
        hasError={hasError}
        isLoading={isLoading}
        onResetError={handleResetError}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};
