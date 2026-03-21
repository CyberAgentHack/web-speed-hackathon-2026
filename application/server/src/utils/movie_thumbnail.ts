import { runFfmpeg } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";

export const MOVIE_THUMBNAIL_EXTENSION = "avif";

export async function createMovieThumbnail(
    sourceMoviePath: string,
    outputThumbnailPath: string,
): Promise<void> {
    await runFfmpeg([
        "-y",
        "-i",
        sourceMoviePath,
        "-frames:v",
        "1",
        "-vf",
        "thumbnail,scale='min(iw,600)':-1",
        "-c:v",
        "libaom-av1",
        "-still-picture",
        "1",
        "-b:v",
        "0",
        outputThumbnailPath,
    ]);
}
