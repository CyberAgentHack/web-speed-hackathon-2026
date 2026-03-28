import React from "react";

export const TypingIndicator = React.memo(() => {
  return (
    <div role="status" aria-label="応答中" className="flex items-center gap-1">
      <span className="dot delay-0" />
      <span className="dot delay-150" />
      <span className="dot delay-300" />
    </div>
  );
});
