export function runDialogCommand(command: string | undefined, dialogId: string | undefined) {
  if (dialogId == null) {
    return;
  }

  const dialog = document.getElementById(dialogId);
  if (!(dialog instanceof HTMLDialogElement)) {
    return;
  }

  if (command === "show-modal") {
    if (!dialog.open) {
      dialog.showModal();
    }
    return;
  }

  if (command === "close" && dialog.open) {
    dialog.close();
  }
}
