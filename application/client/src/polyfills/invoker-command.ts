// Invoker Commands API (command/commandfor) のポリフィル
// テスト環境のブラウザが未対応の場合にフォールバック
if (typeof HTMLButtonElement.prototype === "object" && !("command" in HTMLButtonElement.prototype)) {
  document.addEventListener("click", (e) => {
    const button = (e.target as Element)?.closest?.("button[commandfor]");
    if (!(button instanceof HTMLButtonElement)) return;

    const command = button.getAttribute("command");
    const targetId = button.getAttribute("commandfor");
    if (!command || !targetId) return;

    const target = document.getElementById(targetId);
    if (!(target instanceof HTMLDialogElement)) return;

    if (command === "show-modal" && !target.open) {
      target.showModal();
    } else if (command === "close" && target.open) {
      target.close();
    }
  });
}
