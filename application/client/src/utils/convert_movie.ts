/**
 * 動画ファイルをそのままサーバーに送信する（変換はサーバー側で実施）
 */
export async function convertMovie(file: File, _options: { extension: string; size?: number }): Promise<Blob> {
  return file;
}
