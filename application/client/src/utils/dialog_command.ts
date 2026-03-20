const MAX_DIALOG_LOOKUP_ATTEMPTS = 60;

const getDialogById = (id: string): HTMLDialogElement | null => {
  const dialog = document.getElementById(id);
  return dialog instanceof HTMLDialogElement ? dialog : null;
};

const showDialogWhenReady = (dialogId: string, attempts = 0) => {
  const dialog = getDialogById(dialogId);
  if (dialog !== null) {
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // showModal can throw when the browser rejects opening state.
      }
    }
    return;
  }
  if (attempts >= MAX_DIALOG_LOOKUP_ATTEMPTS) {
    return;
  }
  requestAnimationFrame(() => {
    showDialogWhenReady(dialogId, attempts + 1);
  });
};

export const runDialogCommand = (command?: string, commandfor?: string) => {
  if (!command || !commandfor || typeof document === "undefined") return;

  if (command === "show-modal") {
    showDialogWhenReady(commandfor);
    return;
  }

  const dialog = getDialogById(commandfor);
  if (dialog === null) return;

  if (command === "close" && dialog.open) {
    dialog.close();
  }
};
