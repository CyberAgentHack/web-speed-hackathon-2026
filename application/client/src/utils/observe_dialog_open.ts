export function observeDialogOpen(
  dialog: HTMLDialogElement,
  onChange: (isOpen: boolean) => void,
): () => void {
  const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.type === "attributes" && mutation.attributeName === "open") {
        onChange(dialog.open);
        break;
      }
    }
  });

  observer.observe(dialog, {
    attributeFilter: ["open"],
    attributes: true,
  });

  return () => {
    observer.disconnect();
  };
}
