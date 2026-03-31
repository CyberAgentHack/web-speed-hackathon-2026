export const RouteLoadingPage = () => {
  return (
    <div className="bg-cax-surface flex min-h-screen flex-col items-center justify-center gap-3 px-4">
      <div className="flex gap-2" aria-hidden="true">
        <span className="bg-cax-brand/30 h-3 w-3 rounded-full animate-pulse" />
        <span className="bg-cax-brand/50 h-3 w-3 rounded-full animate-pulse [animation-delay:120ms]" />
        <span className="bg-cax-brand/70 h-3 w-3 rounded-full animate-pulse [animation-delay:240ms]" />
      </div>
      <p className="text-cax-text-muted text-sm">ページを読み込んでいます</p>
    </div>
  );
};
