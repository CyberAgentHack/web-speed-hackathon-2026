import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewPostModalPage } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage";
import { computeWavPeaks, extractImageAlt, extractSoundMetadata } from "@web-speed-hackathon-2026/client/src/utils/extract_client_metadata";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

interface FileUploadTask {
  url: string;
  file: File;
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<{ post: Models.Post; uploads: FileUploadTask[] }> {
  const uploads: FileUploadTask[] = [];

  const imagePayloads = await Promise.all(
    images.map(async (image) => {
      const buffer = await image.arrayBuffer();
      const alt = extractImageAlt(buffer);
      const id = crypto.randomUUID();
      uploads.push({ url: `/api/v1/images/${id}/file`, file: image });
      return { id, alt };
    }),
  );

  let moviePayload: { id: string } | undefined;
  if (movie) {
    const id = crypto.randomUUID();
    uploads.push({ url: `/api/v1/movies/${id}/file`, file: movie });
    moviePayload = { id };
  }

  let soundPayload: { id: string; title?: string; artist?: string } | undefined;
  let peaksUpload: { soundId: string; data: { max: number; peaks: number[] } } | undefined;
  if (sound) {
    const buffer = await sound.arrayBuffer();
    const meta = extractSoundMetadata(buffer);
    const peaks = computeWavPeaks(buffer);
    const id = crypto.randomUUID();
    uploads.push({ url: `/api/v1/sounds/${id}/file`, file: sound });
    soundPayload = { id, ...meta };
    if (peaks) {
      peaksUpload = { soundId: id, data: peaks };
    }
  }

  // Upload peaks before post creation so it's available when page renders
  if (peaksUpload) {
    await fetch(`/api/v1/sounds/${peaksUpload.soundId}/peaks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(peaksUpload.data),
    });
  }

  const post = await sendJSON<Models.Post>("/api/v1/posts", {
    images: imagePayloads,
    movie: moviePayload,
    sound: soundPayload,
    text,
  });

  return { post, uploads };
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
        const { post, uploads } = await sendNewPost(params);
        ref.current?.close();
        navigate(`/posts/${post.id}`);
        for (const { url, file } of uploads) {
          fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: file,
          }).catch((err) => {
            console.error("Background upload failed:", err);
          });
        }
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
