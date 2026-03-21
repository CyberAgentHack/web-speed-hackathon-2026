import { runFFmpeg } from "@web-speed-hackathon-2026/server/src/utils/run_ffmpeg";

export async function convertMovie(input: Buffer): Promise<Buffer> {
  return runFFmpeg(input, [
    "-t", "5", "-r", "10",
    "-vf", "crop='min(iw,ih)':'min(iw,ih)'",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-preset", "fast", "-crf", "23", "-an",
  ], "mp4");
}
