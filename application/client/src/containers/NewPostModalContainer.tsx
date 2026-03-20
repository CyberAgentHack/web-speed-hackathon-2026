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

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: images
      ? await Promise.all(images.map((image) => sendFile("/api/v1/images", image)))
      : [],
    movie: movie ? await sendFile("/api/v1/movies", movie) : undefined,
    sound: sound ? await sendFile("/api/v1/sounds", sound) : undefined,
    text,
  };

  return sendJSON("/api/v1/posts", payload);
}

interface Props {
  id: string;
  isOpen: boolean;
  onRequestClose: () => void;
}

export const NewPostModalContainer = ({ id, isOpen, onRequestClose }: Props) => {
  const dialogId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    if (isOpen) {
      if (!element.open) {
        element.showModal();
      }
      return;
    }

    if (element.open) {
      element.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    const handleClose = () => {
      onRequestClose();
      setResetKey((key) => key + 1);
    };
    element.addEventListener("close", handleClose);
    element.addEventListener("cancel", handleClose);
    return () => {
      element.removeEventListener("close", handleClose);
      element.removeEventListener("cancel", handleClose);
    };
  }, [onRequestClose]);

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
        onRequestClose();
        navigate(`/posts/${post.id}`);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, onRequestClose],
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
