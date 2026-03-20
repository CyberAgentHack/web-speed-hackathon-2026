import { load, ImageIFD } from "piexifjs";
import sizeOf from "image-size";

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    if (type === "analyzeSentiment") {
      // 形態素解析を行わない軽量なモック
      const score = 0;
      const label = "neutral";
      
      self.postMessage({ id, result: { score, label } });
    } else if (type === "extractExif") {
      // payload は Uint8Array または ArrayBuffer を想定
      const binary = Array.from(new Uint8Array(payload))
        .map((b) => String.fromCharCode(b))
        .join("");
      const exif = load(binary);
      const raw = exif?.["0th"]?.[ImageIFD.ImageDescription];
      const alt = raw != null ? new TextDecoder().decode(Uint8Array.from(raw.split("").map((c: string) => c.charCodeAt(0)))) : "";
      
      self.postMessage({ id, result: alt });
    } else if (type === "getImageSize") {
      const size = sizeOf(Buffer.from(payload));
      self.postMessage({ id, result: size });
    }
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
