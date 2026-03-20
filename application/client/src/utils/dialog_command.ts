export const runDialogCommand = (command?: string, commandfor?: string) => {
  if (!command || !commandfor || typeof document === "undefined") return;

  const dialog = document.getElementById(commandfor);
  if (!(dialog instanceof HTMLDialogElement)) return;

  if (command === "show-modal") {
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // showModal can throw when the browser rejects opening state.
      }
    }
    return;
  }

  if (command === "close" && dialog.open) {
    dialog.close();
  }
};
