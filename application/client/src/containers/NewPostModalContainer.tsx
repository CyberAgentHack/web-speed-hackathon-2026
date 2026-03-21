import { Suspense, lazy, useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendFile, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const NewPostModalPage = lazy(async () => {
  const module =
    await import("@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage");
  return { default: module.NewPostModalPage };
});

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: images
      ? await Promise.all(images.map((image) => sendFile<{ alt: string; id: string }>("/api/v1/images", image)))
      : [],
    movie: movie ? await sendFile("/api/v1/movies", movie) : undefined,
    sound: sound ? await sendFile("/api/v1/sounds", sound) : undefined,
    text,
  };

  return sendJSON("/api/v1/posts", payload);
}

interface Props {
  id: string;
  openRequestId: number;
}

export const NewPostModalContainer = ({ id, openRequestId }: Props) => {
  const dialogId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [shouldLoadModalContent, setShouldLoadModalContent] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    const handleToggle = () => {
      if (element.open) {
        setShouldLoadModalContent(true);
      }
      // モーダル開閉時にkeyを更新することでフォームの状態をリセットする
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (openRequestId === 0 || element == null || element.open) {
      return;
    }

    element.showModal();
  }, [openRequestId]);

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
        setIsLoading(false);
        ref.current?.close();
        navigate(`/posts/${post.id}`);
      } catch {
        setHasError(true);
        setIsLoading(false);
      }
    },
    [navigate],
  );

  return (
    <Modal aria-labelledby={dialogId} id={id} ref={ref} closedby="any">
      {shouldLoadModalContent ? (
        <Suspense
          fallback={
            <div className="text-cax-text-muted p-6 text-center text-sm">
              モーダルを読み込み中...
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
