import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";

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
  useDocumentTitle("ダイレクトメッセージ - CaX");
  return (
    <>
      <section className="space-y-4 px-6 py-12 text-center">
        <p className="text-lg font-bold">{headline}</p>
        {description !== "" ? <p className="text-cax-text-muted text-sm">{description}</p> : null}
        <button
          className="bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong inline-flex items-center justify-center rounded-full px-6 py-2 shadow"
          type="button"
          command="show-modal"
          commandfor={authModalId}
        >
          {buttonLabel}
        </button>
      </section>
    </>
  );
};
