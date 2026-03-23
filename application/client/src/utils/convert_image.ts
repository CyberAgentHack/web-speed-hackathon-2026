interface Options {
  extension: unknown;
}

/**
 * 画像ファイルをそのまま返す（変換はサーバーサイドで実施）
 */
export async function convertImage(file: File, _options: Options): Promise<Blob> {
  return file;
}
