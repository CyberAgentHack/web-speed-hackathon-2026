import { ChangeEventHandler, FormEventHandler, useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { AttachFileInputButton } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/AttachFileInputButton";
import { extractAltFromImageFile } from "@web-speed-hackathon-2026/client/src/utils/extract_alt_from_image";

const MAX_UPLOAD_BYTES_LIMIT = 10 * 1024 * 1024;

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

interface Props {
  id: string;
  hasError: boolean;
  isLoading: boolean;
  onResetError: () => void;
  onSubmit: (params: SubmitParams) => Promise<void>;
}

function hasExtension(file: File, extensions: string[]): boolean {
  const lowerName = file.name.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(`.${extension}`));
}

function isAcceptableImage(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    hasExtension(file, ["jpg", "jpeg", "png", "gif", "webp", "avif", "tif", "tiff"])
  );
}

function isAcceptableSound(file: File): boolean {
  return (
    file.type === "audio/mpeg" ||
    file.type === "audio/wav" ||
    file.type === "audio/wave" ||
    file.type === "audio/x-wav" ||
    hasExtension(file, ["mp3", "wav", "wave"])
  );
}

function isAcceptableMovie(file: File): boolean {
  return (
    file.type === "video/mp4" ||
    file.type === "video/x-matroska" ||
    hasExtension(file, ["mp4", "mkv"])
  );
}

export const NewPostModalPage = ({
  id,
  hasError,
  isLoading,
  onResetError,
  onSubmit,
}: Props) => {
  const [params, setParams] = useState<SubmitParams>({
    images: [],
    movie: undefined,
    sound: undefined,
    text: "",
  });

  const paramsRef = useRef(params);
  const mountedRef = useRef(true);
  const selectionVersionRef = useRef(0);
  const pendingConversionRef = useRef<Promise<void> | null>(null);

  const [hasFileError, setHasFileError] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const commitParams = useCallback((next: SubmitParams) => {
    paramsRef.current = next;
    setParams(next);
  }, []);

  const updateParams = useCallback(
    (updater: (current: SubmitParams) => SubmitParams) => {
      commitParams(updater(paramsRef.current));
    },
    [commitParams],
  );

  const beginSelection = useCallback(() => {
    selectionVersionRef.current += 1;
    pendingConversionRef.current = null;
    if (mountedRef.current) {
      setIsConverting(false);
    }
    return selectionVersionRef.current;
  }, []);

  const finishSelection = useCallback((version: number) => {
    if (!mountedRef.current || selectionVersionRef.current !== version) {
      return;
    }

    pendingConversionRef.current = null;
    setIsConverting(false);
  }, []);

  const handleChangeText = useCallback<ChangeEventHandler<HTMLTextAreaElement>>((ev) => {
    const value = ev.currentTarget.value;
    updateParams((current) => ({
      ...current,
      text: value,
    }));
  }, [updateParams]);

  const handleChangeImages = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (ev) => {
      const files = Array.from(ev.currentTarget.files ?? []).slice(0, 4);
      if (files.length === 0) {
        return;
      }

      const isValid = files.every((file) => file.size <= MAX_UPLOAD_BYTES_LIMIT);
      const version = beginSelection();

      setHasFileError(isValid !== true);
      if (!isValid) {
        return;
      }

      const allAcceptable = files.every((file) => isAcceptableImage(file));
      if (!allAcceptable) {
        setHasFileError(true);
        return;
      }

      if (mountedRef.current) {
        setIsConverting(true);
      }

      const pending = Promise.all(
        files.map(async (file) => ({
          alt: await extractAltFromImageFile(file),
          file,
        })),
      )
        .then((images) => {
        if (!mountedRef.current || selectionVersionRef.current !== version) {
          return;
        }

        updateParams((current) => ({
          ...current,
          images,
          movie: undefined,
          sound: undefined,
        }));
      })
        .catch(() => {
          if (mountedRef.current && selectionVersionRef.current === version) {
            setHasFileError(true);
          }
        })
        .finally(() => {
          finishSelection(version);
        });

      pendingConversionRef.current = pending;
    },
    [beginSelection, finishSelection, updateParams],
  );

  const handleChangeSound = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (ev) => {
      const file = ev.currentTarget.files?.[0];
      if (file == null) {
        return;
      }

      const isValid = file.size <= MAX_UPLOAD_BYTES_LIMIT;
      const version = beginSelection();

      setHasFileError(isValid !== true);
      if (!isValid) {
        return;
      }

      if (isAcceptableSound(file)) {
        updateParams((current) => ({
          ...current,
          images: [],
          movie: undefined,
          sound: file,
        }));
        return;
      }

      if (mountedRef.current) {
        setIsConverting(true);
      }

      const pending = import("@web-speed-hackathon-2026/client/src/utils/convert_sound")
        .then(({ convertSound }) => convertSound(file, { extension: "mp3" }))
        .then((converted) => {
          if (!mountedRef.current || selectionVersionRef.current !== version) {
            return;
          }

          updateParams((current) => ({
            ...current,
            images: [],
            movie: undefined,
            sound: new File([converted], "converted.mp3", { type: "audio/mpeg" }),
          }));
        })
        .catch(() => {
          if (mountedRef.current && selectionVersionRef.current === version) {
            setHasFileError(true);
          }
        })
        .finally(() => {
          finishSelection(version);
        });

      pendingConversionRef.current = pending;
    },
    [beginSelection, finishSelection, updateParams],
  );

  const handleChangeMovie = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (ev) => {
      const file = ev.currentTarget.files?.[0];
      if (file == null) {
        return;
      }

      const isValid = file.size <= MAX_UPLOAD_BYTES_LIMIT;
      const version = beginSelection();

      setHasFileError(isValid !== true);
      if (!isValid) {
        return;
      }

      if (isAcceptableMovie(file)) {
        updateParams((current) => ({
          ...current,
          images: [],
          movie: file,
          sound: undefined,
        }));
        return;
      }

      if (mountedRef.current) {
        setIsConverting(true);
      }

      const pending = import("@web-speed-hackathon-2026/client/src/utils/convert_movie")
        .then(({ convertMovie }) => convertMovie(file, { extension: "mp4", size: undefined }))
        .then((converted) => {
          if (!mountedRef.current || selectionVersionRef.current !== version) {
            return;
          }

          updateParams((current) => ({
            ...current,
            images: [],
            movie: new File([converted], "converted.mp4", {
              type: "video/mp4",
            }),
            sound: undefined,
          }));
        })
        .catch(() => {
          if (mountedRef.current && selectionVersionRef.current === version) {
            setHasFileError(true);
          }
        })
        .finally(() => {
          finishSelection(version);
        });

      pendingConversionRef.current = pending;
    },
    [beginSelection, finishSelection, updateParams],
  );

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    async (ev) => {
      ev.preventDefault();
      onResetError();

      await pendingConversionRef.current;
      await onSubmit(paramsRef.current);
    },
    [onResetError, onSubmit],
  );

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 id={id} className="text-center text-2xl font-bold">
        新規投稿
      </h2>

      <textarea
        className="border-cax-border placeholder-cax-text-subtle focus:outline-cax-brand w-full resize-none rounded-xl border px-3 py-2 focus:outline-2 focus:outline-offset-2"
        rows={4}
        onChange={handleChangeText}
        placeholder="いまなにしてる？"
      />

      <div className="text-cax-text flex w-full items-center justify-evenly">
        <AttachFileInputButton
          accept="image/*"
          active={params.images.length !== 0}
          icon={<FontAwesomeIcon iconType="images" styleType="solid" />}
          label="画像を添付"
          onChange={handleChangeImages}
        />
        <AttachFileInputButton
          accept="audio/*"
          active={params.sound !== undefined}
          icon={<FontAwesomeIcon iconType="music" styleType="solid" />}
          label="音声を添付"
          onChange={handleChangeSound}
        />
        <AttachFileInputButton
          accept="video/*"
          active={params.movie !== undefined}
          icon={<FontAwesomeIcon iconType="video" styleType="solid" />}
          label="動画を添付"
          onChange={handleChangeMovie}
        />
      </div>

      <ModalSubmitButton
        disabled={isConverting || isLoading || params.text === ""}
        loading={isConverting || isLoading}
      >
        {isConverting || isLoading ? "変換中" : "投稿する"}
      </ModalSubmitButton>

      <ModalErrorMessage>
        {hasFileError ? "10 MB より小さくしてください" : hasError ? "投稿ができませんでした" : null}
      </ModalErrorMessage>
    </form>
  );
};
