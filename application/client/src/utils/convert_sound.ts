/**
 * 音声ファイルをそのままサーバーに送信する（変換・メタデータ処理はサーバー側で実施）
 */
export async function convertSound(file: File, _options: { extension: string }): Promise<Blob> {
  return file;
}
