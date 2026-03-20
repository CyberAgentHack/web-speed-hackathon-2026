import fs from "fs";
import path from "path";

import { PUBLIC_PATH, UPLOAD_PATH } from "@web-speed-hackathon-2026/server/src/paths";

export const MOVIE_EXTENSIONS = ["webm", "mp4", "gif"] as const;
export type MovieExtension = (typeof MOVIE_EXTENSIONS)[number];

function movieFileCandidates(movieId: string): string[] {
  return [PUBLIC_PATH, UPLOAD_PATH].flatMap((basePath) =>
    MOVIE_EXTENSIONS.map((extension) => path.resolve(basePath, `movies/${movieId}.${extension}`)),
  );
}

export function resolveMovieExtension(movieId: string): MovieExtension | null {
  for (const filePath of movieFileCandidates(movieId)) {
    if (fs.existsSync(filePath)) {
      return path.extname(filePath).slice(1) as MovieExtension;
    }
  }

  return null;
}
