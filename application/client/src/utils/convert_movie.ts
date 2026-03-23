interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 動画ファイルをそのまま返す（変換はサーバーサイドで実施）
 */
export async function convertMovie(file: File, _options: Options): Promise<Blob> {
  return file;
}
