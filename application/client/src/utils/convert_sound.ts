interface Options {
  extension: string;
}

/**
 * 音声ファイルをそのまま返す（変換はサーバーサイドで実施）
 */
export async function convertSound(file: File, _options: Options): Promise<Blob> {
  return file;
}
