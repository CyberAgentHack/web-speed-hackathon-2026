import { TermPage } from "./TermPage";
import { TermsNavigation } from "./TermsNavigation";

interface Props {
  authModalId: string;
}

export const TermsStandaloneShell = ({ authModalId }: Props) => {
  return (
    <div className="relative z-0 flex justify-center font-sans">
      <div className="bg-cax-surface text-cax-text flex min-h-screen max-w-full">
        <aside className="relative z-10">
          <TermsNavigation authModalId={authModalId} />
        </aside>
        <main className="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0 min-h-screen">
          <TermPage />
        </main>
      </div>
    </div>
  );
};
