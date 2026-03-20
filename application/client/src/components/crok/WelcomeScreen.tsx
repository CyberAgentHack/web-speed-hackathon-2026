import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

export const WelcomeScreen = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 h-20 w-20">
        <CrokLogo className="h-full w-full" />
      </div>
      <h1 className="text-cax-text mb-2 text-2xl font-bold">Crok AI</h1>
      <p className="text-cax-text-muted mb-8">
        AIアシスタントに質問してみましょう
      </p>
    </div>
  );
};
