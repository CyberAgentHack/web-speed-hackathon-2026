import { ChangeEventHandler, FormEventHandler, useCallback, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { AttachFileInputButton } from "@web-speed-hackathon-2026/client/src/components/new_post_modal/AttachFileInputButton";

const MAX_UPLOAD_BYTES_LIMIT = 10 * 1024 * 1024;

interface SubmitParams {
  images: File[];
  movie: File | undefined;
  sound: File | undefined;
  text: string;
}

interface Props {
  id: string;
  hasError: boolean;
  isLoading: boolean;
  onResetError: () => void;
  onSubmit: (params: SubmitParams) => void;
}

export const NewPostModalPage = ({ id, hasError, isLoading, onResetError, onSubmit }: Props) => {
  const textRef = useRef("");
  const filesRef = useRef<{ images: File[]; movie: File | undefined; sound: File | undefined }>({
    images: [],
    movie: undefined,
    sound: undefined,
  });

  const [hasText, setHasText] = useState(false);
  const [hasFileError, setHasFileError] = useState(false);
  const [activeAttach, setActiveAttach] = useState<"none" | "images" | "sound" | "movie">("none");

  const handleChangeText = useCallback<ChangeEventHandler<HTMLTextAreaElement>>((ev) => {
    const value = ev.currentTarget.value;
    textRef.current = value;
    setHasText(value !== "");
  }, []);

  const handleChangeImages = useCallback<ChangeEventHandler<HTMLInputElement>>((ev) => {
    const files = Array.from(ev.currentTarget.files ?? []).slice(0, 4);
    const isValid = files.every((file) => file.size <= MAX_UPLOAD_BYTES_LIMIT);

    setHasFileError(isValid !== true);
    if (isValid) {
      filesRef.current = { images: files, movie: undefined, sound: undefined };
      setActiveAttach(files.length > 0 ? "images" : "none");
    }
  }, []);

  const handleChangeSound = useCallback<ChangeEventHandler<HTMLInputElement>>((ev) => {
    const file = Array.from(ev.currentTarget.files ?? [])[0]!;
    const isValid = file.size <= MAX_UPLOAD_BYTES_LIMIT;

    setHasFileError(isValid !== true);
    if (isValid) {
      filesRef.current = { images: [], movie: undefined, sound: file };
      setActiveAttach("sound");
    }
  }, []);

  const handleChangeMovie = useCallback<ChangeEventHandler<HTMLInputElement>>((ev) => {
    const file = Array.from(ev.currentTarget.files ?? [])[0]!;
    const isValid = file.size <= MAX_UPLOAD_BYTES_LIMIT;

    setHasFileError(isValid !== true);
    if (isValid) {
      filesRef.current = { images: [], movie: file, sound: undefined };
      setActiveAttach("movie");
    }
  }, []);

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (ev) => {
      ev.preventDefault();
      onResetError();
      onSubmit({
        ...filesRef.current,
        text: textRef.current,
      });
    },
    [onSubmit, onResetError],
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
          active={activeAttach === "images"}
          icon={<FontAwesomeIcon iconType="images" styleType="solid" />}
          label="画像を添付"
          onChange={handleChangeImages}
        />
        <AttachFileInputButton
          accept="audio/*"
          active={activeAttach === "sound"}
          icon={<FontAwesomeIcon iconType="music" styleType="solid" />}
          label="音声を添付"
          onChange={handleChangeSound}
        />
        <AttachFileInputButton
          accept="video/*"
          active={activeAttach === "movie"}
          icon={<FontAwesomeIcon iconType="video" styleType="solid" />}
          label="動画を添付"
          onChange={handleChangeMovie}
        />
      </div>

      <ModalSubmitButton disabled={isLoading || !hasText} loading={isLoading}>
        {isLoading ? "投稿中" : "投稿する"}
      </ModalSubmitButton>

      <ModalErrorMessage>
        {hasFileError ? "10 MB より小さくしてください" : hasError ? "投稿ができませんでした" : null}
      </ModalErrorMessage>
    </form>
  );
};
