import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewPostModalPage } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage";
import {
  primePrefetchedJSON,
  prefetchJSON,
  sendFile,
  sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SubmitImage {
  alt: string;
  file: File;
}

interface SubmitParams {
  images: SubmitImage[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

interface UploadedImage {
  id: string;
}

const DISALLOWED_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
function sanitizeAltText(alt: string): string {
  return alt.replace(DISALLOWED_CONTROL_CHARACTERS, "");
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: images
      ? await Promise.all(
          images.map(async ({ alt, file }) => {
            const uploadedImage = await sendFile<UploadedImage>("/api/v1/images", file);
            return { id: uploadedImage.id, alt: sanitizeAltText(alt) };
          }),
        )
      : [],
    movie: movie ? await sendFile("/api/v1/movies", movie) : undefined,
    sound: sound ? await sendFile("/api/v1/sounds", sound) : undefined,
    text,
  };

  return sendJSON("/api/v1/posts", payload);
}

interface Props {
  activeUser: Models.User | null;
  id: string;
}

export const NewPostModalContainer = ({ activeUser, id }: Props) => {
  const dialogId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    const handleClose = () => {
      setResetKey((key) => key + 1);
      setHasError(false);
    };
    element.addEventListener("close", handleClose);
    return () => {
      element.removeEventListener("close", handleClose);
    };
  }, []);

  const navigate = useNavigate();

  const handleResetError = useCallback(() => {
    setHasError(false);
  }, []);

  const handleSubmit = useCallback(
    async (params: SubmitParams) => {
      try {
        setIsLoading(true);
        const post = await sendNewPost(params);
        const optimisticPost =
          activeUser === null
            ? undefined
            : ({
                ...post,
                user: activeUser,
              } as Models.Post);
        const postPath = `/api/v1/posts/${post.id}`;
        if (optimisticPost !== undefined) {
          primePrefetchedJSON(postPath, optimisticPost);
        } else {
          primePrefetchedJSON(postPath, post);
          void prefetchJSON(postPath);
        }
        ref.current?.close();
        navigate(`/posts/${post.id}`, {
          state: optimisticPost === undefined ? undefined : { initialPost: optimisticPost },
        });
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [activeUser, navigate],
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
