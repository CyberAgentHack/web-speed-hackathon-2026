import { Helmet } from "react-helmet";
import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";

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
  return (
    <>
      <Helmet>
        <title>ダイレクトメッセージ - CaX</title>
      </Helmet>
      <section className="space-y-4 px-6 py-12 text-center">
        <p className="text-lg font-bold">{headline}</p>
        {description !== "" ? <p className="text-cax-text-muted text-sm">{description}</p> : null}
        <Button
          className="mt-4"
          command="show-modal"
          commandfor={authModalId}
          variant="primary"
        >
          {buttonLabel}
        </Button>
      </section>
    </>
  );
};
