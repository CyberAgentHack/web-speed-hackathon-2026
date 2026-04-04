function getDialogElement(id: string): HTMLDialogElement | null {
  const element = document.getElementById(id);
  return element instanceof HTMLDialogElement ? element : null;
}

export function openDialog(id: string): boolean {
  const dialog = getDialogElement(id);
  if (dialog == null) {
    return false;
  }

  if (!dialog.open) {
    dialog.showModal();
  }

  return true;
}

export function showDialog(id: string) {
  void openDialog(id);
}

export function closeDialog(id: string): boolean {
  const dialog = getDialogElement(id);
  if (dialog == null) {
    return false;
  }

  if (dialog.open) {
    dialog.close();
  }

  return true;
}
