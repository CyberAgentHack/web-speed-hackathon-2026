import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

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
  const hasPreloadedMediaToolsRef = useRef(false);
  const [hasLoadedPage, setHasLoadedPage] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [pendingDestinationPath, setPendingDestinationPath] = useState<string | null>(null);

  const preloadModalDependencies = useCallback(() => {
    if (hasPreloadedMediaToolsRef.current) {
      return;
    }

    hasPreloadedMediaToolsRef.current = true;

    void import("@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage");
    void import("@imagemagick/magick-wasm");
    void import("@web-speed-hackathon-2026/client/src/utils/convert_image");
    void import("@web-speed-hackathon-2026/client/src/utils/convert_sound");
    void import("@web-speed-hackathon-2026/client/src/utils/convert_movie");
    void import("@web-speed-hackathon-2026/client/src/utils/load_ffmpeg").then(
      ({ preloadFFmpegAssets }) => {
        preloadFFmpegAssets();
      },
    );
  }, []);

  useEffect(() => {
    const element = ref.current;
    const appShell = document.querySelector<HTMLElement>("[data-app-shell]");
    if (element == null || appShell == null) {
      return;
    }

    const previousAriaHidden = appShell.getAttribute("aria-hidden");
    const previousInert = appShell.inert;

    const toggleBackgroundAccessibility = (isOpen: boolean) => {
      appShell.inert = isOpen;
      if (isOpen) {
        appShell.setAttribute("aria-hidden", "true");
        return;
      }

      appShell.inert = previousInert;
      if (previousAriaHidden == null) {
        appShell.removeAttribute("aria-hidden");
      } else {
        appShell.setAttribute("aria-hidden", previousAriaHidden);
      }
    };

    const handleToggle = () => {
      if (element.open) {
        setHasLoadedPage(true);
        preloadModalDependencies();
      }
      toggleBackgroundAccessibility(element.open);
      // モーダル開閉時にkeyを更新することでフォームの状態をリセットする
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      toggleBackgroundAccessibility(false);
      element.removeEventListener("toggle", handleToggle);
    };
  }, [preloadModalDependencies]);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pendingDestinationPath == null || pathname !== pendingDestinationPath) {
      return;
    }

    ref.current?.close();
    setPendingDestinationPath(null);
  }, [pathname, pendingDestinationPath]);

  const handleResetError = useCallback(() => {
    setHasError(false);
  }, []);

  const handleSubmit = useCallback(
    async (params: SubmitParams) => {
      try {
        setIsLoading(true);
        const post = await sendNewPost(params);
        const destinationPath = `/posts/${post.id}`;
        setPendingDestinationPath(destinationPath);
        navigate(destinationPath);
      } catch {
        setPendingDestinationPath(null);
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
