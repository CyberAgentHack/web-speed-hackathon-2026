import { MODAL_IDS } from "@web-speed-hackathon-2026/client/src/constants";

interface Props {
  headline: string;
  description?: string;
  buttonLabel?: string;
}

export const CrokGate = ({
  headline,
  description = "サインインするとCrok機能をご利用いただけます。",
  buttonLabel = "サインイン",
}: Props) => {
  return (
    <>
      <title>Crok - CaX</title>
      <section className="space-y-4 px-6 py-12 text-center">
        <p className="text-lg font-bold">{headline}</p>
        {description !== "" ? <p className="text-cax-text-muted text-sm">{description}</p> : null}
        <button
          className="bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong inline-flex items-center justify-center rounded-full px-6 py-2 shadow"
          type="button"
          command="show-modal"
          commandfor={MODAL_IDS.AUTH}
        >
          {buttonLabel}
        </button>
      </section>
    </>
  );
};
