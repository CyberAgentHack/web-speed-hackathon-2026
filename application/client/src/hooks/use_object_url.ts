import { useEffect, useState } from "react";

type ObjectUrlSource = ArrayBuffer | Blob | Uint8Array | null;

interface Options {
  type?: string;
}

export function useObjectUrl(source: ObjectUrlSource, options: Options = {}): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (source === null) {
      setObjectUrl(null);
      return;
    }

    const blob =
      source instanceof Blob ? source : new Blob([source as ArrayBuffer], options.type ? { type: options.type } : {});
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [options.type, source]);

  return objectUrl;
}
