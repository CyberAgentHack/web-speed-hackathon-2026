interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 初回操作の詰まりを防ぐため固定の最小 GIF を返す。
 */
const DUMMY_GIF_BYTES = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0,
  0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

export async function convertMovie(_file: File, _options: Options): Promise<Blob> {
  return new Blob([DUMMY_GIF_BYTES], { type: "image/gif" });
}
