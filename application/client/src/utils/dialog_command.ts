const MAX_DIALOG_LOOKUP_ATTEMPTS = 60;
const DIALOG_OPEN_REQUEST_EVENT_NAME = "cax:dialog-open-request";

interface DialogOpenRequestDetail {
  id: string;
}

const getDialogById = (id: string): HTMLDialogElement | null => {
  const dialog = document.getElementById(id);
  return dialog instanceof HTMLDialogElement ? dialog : null;
};

export const showDialog = (dialog: HTMLDialogElement): boolean => {
  if (dialog.open) {
    return true;
  }
  try {
    dialog.showModal();
  } catch {
    // showModal can throw when the browser rejects opening state.
  }
  return dialog.open;
};

const dispatchDialogOpenRequest = (dialogId: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<DialogOpenRequestDetail>(DIALOG_OPEN_REQUEST_EVENT_NAME, {
      detail: { id: dialogId },
    }),
  );
};

const showDialogWhenReady = (dialogId: string, attempts = 0): void => {
  const dialog = getDialogById(dialogId);
  if (dialog !== null) {
    const opened = showDialog(dialog);
    if (!opened && attempts < MAX_DIALOG_LOOKUP_ATTEMPTS) {
      requestAnimationFrame(() => {
        showDialogWhenReady(dialogId, attempts + 1);
      });
    }
    return;
  }
  if (attempts === 0) {
    dispatchDialogOpenRequest(dialogId);
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
    openDialog(commandfor);
    return;
  }

  if (command === "close") {
    closeDialog(commandfor);
  }
};

export const openDialog = (dialogId: string): void => {
  showDialogWhenReady(dialogId);
};

export const closeDialog = (dialogId: string): void => {
  const dialog = getDialogById(dialogId);
  if (dialog?.open) {
    dialog.close();
  }
};

export const listenDialogOpenRequest = (listener: (dialogId: string) => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleDialogOpenRequest = (event: Event) => {
    const customEvent = event as CustomEvent<DialogOpenRequestDetail>;
    const dialogId = customEvent.detail?.id;
    if (typeof dialogId === "string") {
      listener(dialogId);
    }
  };

  window.addEventListener(DIALOG_OPEN_REQUEST_EVENT_NAME, handleDialogOpenRequest);
  return () => {
    window.removeEventListener(DIALOG_OPEN_REQUEST_EVENT_NAME, handleDialogOpenRequest);
  };
};
