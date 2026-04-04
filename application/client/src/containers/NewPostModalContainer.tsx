import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendFile, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { observeDialogOpen } from "@web-speed-hackathon-2026/client/src/utils/observe_dialog_open";

const NewPostModalPage = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage").then(
    (m) => ({ default: m.NewPostModalPage }),
  ),
);

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
}

export const NewPostModalContainer = ({ id }: Props) => {
  const dialogId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [shouldLoadModalPage, setShouldLoadModalPage] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    return observeDialogOpen(element, (isOpen) => {
      if (isOpen) {
        setShouldLoadModalPage(true);
      } else {
        setResetKey((key) => key + 1);
      }
    });
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
      <h2 id={dialogId} className="sr-only">
        新規投稿
      </h2>
      {shouldLoadModalPage ? (
        <Suspense
          fallback={
            <p className="text-cax-text-muted p-4" role="status">
              読込中...
            </p>
          }
        >
          <NewPostModalPage
            key={resetKey}
            hasError={hasError}
            isLoading={isLoading}
            onResetError={handleResetError}
            onSubmit={handleSubmit}
          />
        </Suspense>
      ) : null}
    </Modal>
  );
};
