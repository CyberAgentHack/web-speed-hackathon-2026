/** Extract ImageDescription (tag 0x010E) from TIFF IFD header. */
function extractTiffAlt(buf: ArrayBuffer): string {
  const view = new DataView(buf);
  if (buf.byteLength < 8) return "";
  const magic = view.getUint16(0);
  const isBE = magic === 0x4d4d;
  const isLE = magic === 0x4949;
  if (!isBE && !isLE) return "";
  const r16 = (o: number) => view.getUint16(o, isLE);
  const r32 = (o: number) => view.getUint32(o, isLE);
  const ifdOffset = r32(4);
  if (ifdOffset + 2 > buf.byteLength) return "";
  const n = r16(ifdOffset);
  for (let i = 0; i < n; i++) {
    const off = ifdOffset + 2 + i * 12;
    if (off + 12 > buf.byteLength) break;
    if (r16(off) === 0x010e) {
      const count = r32(off + 4);
      const valOff = count <= 4 ? off + 8 : r32(off + 8);
      if (valOff + count > buf.byteLength) return "";
      const bytes = new Uint8Array(buf, valOff, count);
      let end = bytes.length;
      while (end > 0 && bytes[end - 1] === 0) end--;
      return new TextDecoder().decode(bytes.subarray(0, end));
    }
  }
  return "";
}

/** Compress image: resize to max 1920px, output JPEG. Returns { file, alt }.
 *  Falls back to original file if the format is not decodable (e.g. TIFF). */
export async function compressImage(file: File): Promise<{ file: File; alt: string }> {
  const buf = await file.arrayBuffer();
  const alt = extractTiffAlt(buf);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([buf]));
  } catch {
    // Format not supported by browser (e.g. TIFF) — send original file
    return { file, alt };
  }

  const MAX = 1920;
  let { width, height } = bitmap;
  if (width > MAX || height > MAX) {
    const scale = MAX / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
  const compressed = new File([blob], "image.jpg", { type: "image/jpeg" });
  return { file: compressed, alt };
}
