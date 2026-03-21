/** Pass-through: send raw file to server. Server converts with ffmpeg.
 *  The previous implementation used a 5-second rAF loop with MediaRecorder,
 *  which blocked the main thread and destroyed TBT scores. */
export async function compressVideo(file: File): Promise<File> {
  return file;
}
