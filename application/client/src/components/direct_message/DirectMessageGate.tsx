import { Helmet } from "react-helmet";
import { ComponentPropsWithRef } from "react";

import { openDialog } from "@web-speed-hackathon-2026/client/src/utils/dialog_command";

interface Props {
  headline: string;
  description?: string;
  buttonLabel?: string;
  authModalId: string;
}

export const DirectMessageGate = ({
  headline,
  description = "サインインするとダイレクトメッセージ機能をご利用いただけます。",
  buttonLabel = "サインイン",
  authModalId,
}: Props) => {
  const handleOpenAuthModal: ComponentPropsWithRef<"button">["onClick"] = () => {
    openDialog(authModalId);
  };

  return (
    <>
      <Helmet>
        <title>ダイレクトメッセージ - CaX</title>
      </Helmet>
      <section className="space-y-4 px-6 py-12 text-center">
        <p className="text-lg font-bold">{headline}</p>
        {description !== "" ? <p className="text-cax-text-muted text-sm">{description}</p> : null}
        <button
          className="bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong inline-flex items-center justify-center rounded-full px-6 py-2 shadow"
          type="button"
          onClick={handleOpenAuthModal}
        >
          {buttonLabel}
        </button>
      </section>
    </>
  );
};
