import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewPostModalPage } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage";
import { extractImageAlt } from "@web-speed-hackathon-2026/client/src/utils/extract_image_alt";
import { sendFile, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

interface UploadedImage {
  alt: string;
  id: string;
}

const ALT_MAX_LENGTH = 500;

function normalizeAlt(alt: string): string {
  return alt.replace(/\u0000/g, "").trim().slice(0, ALT_MAX_LENGTH);
}

async function uploadImage(file: File): Promise<UploadedImage> {
  const parsedAlt = normalizeAlt(await extractImageAlt(file));
  const path =
    parsedAlt === "" ? "/api/v1/images" : `/api/v1/images?alt=${encodeURIComponent(parsedAlt)}`;
  const uploaded = await sendFile<{ id: string; alt?: string }>(path, file);

  return {
    id: uploaded.id,
    alt: normalizeAlt(uploaded.alt ?? parsedAlt),
  };
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: images ? await Promise.all(images.map((image) => uploadImage(image))) : [],
    movie: movie ? await sendFile("/api/v1/movies", movie) : undefined,
    sound: sound ? await sendFile("/api/v1/sounds", sound) : undefined,
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
