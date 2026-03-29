import { SyntheticEvent } from "react";

/**
 * リサイズ画像 (_wNNN) の読み込みに失敗した場合に、オリジナル画像にフォールバックします
 */
export const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (!target.dataset["errorHandled"]) {
    target.dataset["errorHandled"] = "true";
    if (target.src.includes("_w")) {
      target.src = target.src.replace(/_w\d+/, "");
    }
  }
};
