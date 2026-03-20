import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendFile, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const NewPostModalPage = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage").then(
    (m) => ({ default: m.NewPostModalPage }),
  ),
);

interface PreparedImage {
  alt: string;
  file: File;
}

interface SubmitParams {
  images: PreparedImage[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: images
      ? await Promise.all(
          images.map(async ({ alt, file }) => {
            const uploadedImage = await sendFile<{ id: string }>("/api/v1/images", file);
            return { alt, id: uploadedImage.id };
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
  id: string;
}

export const NewPostModalContainer = ({ id }: Props) => {
  const dialogId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [hasLoadedPage, setHasLoadedPage] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    const handleToggle = () => {
      if (element.open) {
        setHasLoadedPage(true);
      }
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
      {hasLoadedPage ? (
        <Suspense
          fallback={
            <div className="animate-pulse space-y-4 p-2">
              <div className="bg-cax-border mx-auto h-8 w-32 rounded" />
              <div className="bg-cax-border h-24 w-full rounded-xl" />
              <div className="bg-cax-border h-10 w-full rounded-full" />
            </div>
          }
        >
          <NewPostModalPage
            key={resetKey}
            id={dialogId}
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
