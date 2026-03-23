export function runDialogCommand(command?: string, commandfor?: string): void {
  if (commandfor == null) {
    return;
  }

  const target = document.getElementById(commandfor);
  if (!(target instanceof HTMLDialogElement)) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (command === "show-modal") {
      if (!target.open) {
        target.showModal();
      }
      return;
    }

    if (command === "close" && target.open) {
      target.close();
    }
  });
}
