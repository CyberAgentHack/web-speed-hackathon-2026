import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewPostModalPage } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage";
import { compressAudio } from "@web-speed-hackathon-2026/client/src/utils/compress-audio";
import { compressImage } from "@web-speed-hackathon-2026/client/src/utils/compress-image";
import { compressVideo } from "@web-speed-hackathon-2026/client/src/utils/compress-video";
import { sendFile } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: await Promise.all(
      images.map(async (image) => {
        const { file, alt } = await compressImage(image);
        const params = alt ? `?alt=${encodeURIComponent(alt)}` : "";
        return sendFile(`/api/v1/images${params}`, file);
      }),
    ),
    movie: movie ? await sendFile("/api/v1/movies", await compressVideo(movie)) : undefined,
    sound: sound
      ? await (async () => {
          const { file, title, artist } = await compressAudio(sound);
          const params = new URLSearchParams();
          if (title) params.set("title", title);
          if (artist) params.set("artist", artist);
          const qs = params.toString();
          return sendFile(`/api/v1/sounds${qs ? `?${qs}` : ""}`, file);
        })()
      : undefined,
    text,
  };

  const res = await apiClient.posts.$post({ json: payload });
  return res.json();
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

    const handleClose = () => {
      // モーダル閉じたときにkeyを更新することでフォームの状態をリセットする
      setResetKey((key) => key + 1);
    };
    element.addEventListener("close", handleClose);
    return () => {
      element.removeEventListener("close", handleClose);
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
        void navigate(`/posts/${post.id}`);
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
