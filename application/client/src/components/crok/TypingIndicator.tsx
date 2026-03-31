export const TypingIndicator = () => {
  return (
    <div aria-label="応答中" className="flex items-center gap-1" role="status">
      <span
        className="bg-cax-border h-2 w-2 animate-bounce rounded-full"
      />
      <span
        className="bg-cax-border h-2 w-2 animate-bounce rounded-full"
      />
      <span
        className="bg-cax-border h-2 w-2 animate-bounce rounded-full"
      />
    </div>
  );
};
