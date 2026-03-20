interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 動画変換はサーバー側の native ffmpeg に移譲しました。
 * 互換のため、ここではそのままアップロード用 Blob を返します。
 */
export async function convertMovie(file: File, _options: Options): Promise<Blob> {
  return file;
}
