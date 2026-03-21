interface ConvertResult {
  blob: Blob;
  alt: string;
}

function extractJpegComment(data: Uint8Array): string {
  // JPEG COM marker (0xFFFE) からコメントを抽出
  if (data[0] !== 0xff || data[1] !== 0xd8) return "";

  let offset = 2;
  while (offset < data.length - 1) {
    if (data[offset] !== 0xff) break;
    const marker = data[offset + 1]!;

    // COM marker
    if (marker === 0xfe) {
      const length = (data[offset + 2]! << 8) | data[offset + 3]!;
      const commentBytes = data.slice(offset + 4, offset + 2 + length);
      return new TextDecoder().decode(commentBytes);
    }

    // EOI or SOS - stop searching
    if (marker === 0xd9 || marker === 0xda) break;

    const length = (data[offset + 2]! << 8) | data[offset + 3]!;
    offset += 2 + length;
  }

  return "";
}

export async function convertImage(file: File): Promise<ConvertResult> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const alt = extractJpegComment(bytes);

  const img = new Image();
  const url = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to convert to WebP"))),
        "image/webp",
        0.8,
      );
    });

    return { blob, alt };
  } finally {
    URL.revokeObjectURL(url);
  }
}
