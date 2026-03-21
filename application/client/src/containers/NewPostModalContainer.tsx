import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewPostModalPage } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/NewPostModalPage";
import {
  prefetchJSON,
  sendFile,
  sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

interface UploadedImage {
  id: string;
}

const DISALLOWED_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

async function extractImageAlt(file: File): Promise<string> {
  try {
    const { load, ImageIFD } = await import("piexifjs");
    const binary = Array.from(new Uint8Array(await file.arrayBuffer()))
      .map((byte) => String.fromCharCode(byte))
      .join("");
    const exif = load(binary);
    const rawDescription = exif?.["0th"]?.[ImageIFD.ImageDescription];
    if (typeof rawDescription !== "string") {
      return "";
    }
    const decoded = new TextDecoder().decode(
      Uint8Array.from(rawDescription, (char) => char.charCodeAt(0)),
    );
    return decoded.replace(DISALLOWED_CONTROL_CHARACTERS, "");
  } catch {
    return "";
  }
}

async function sendNewPost({ images, movie, sound, text }: SubmitParams): Promise<Models.Post> {
  const payload = {
    images: images
      ? await Promise.all(
          images.map(async (image) => {
            const [uploadedImage, alt] = await Promise.all([
              sendFile<UploadedImage>("/api/v1/images", image),
              extractImageAlt(image),
            ]);

            return { id: uploadedImage.id, alt };
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
        const postPath = `/api/v1/posts/${post.id}`;
        void prefetchJSON(postPath);
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
        isOpen
        isLoading={isLoading}
        onResetError={handleResetError}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};
