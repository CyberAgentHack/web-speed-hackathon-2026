import { useEffect } from "react";

/** document.titleを設定するフック。react-helmetの代替。 */
export function useTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
