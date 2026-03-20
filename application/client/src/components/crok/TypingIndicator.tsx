export const TypingIndicator = () => {
  return (
    <div aria-label="応答中" className="flex items-center gap-1" role="status">
      <span
        className="bg-cax-border h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]"
      />
      <span
        className="bg-cax-border h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]"
      />
      <span
        className="bg-cax-border h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]"
      />
    </div>
  );
};
