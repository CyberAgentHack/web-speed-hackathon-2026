import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import {
  createCanonicalMedia,
  createDerivativeMedia,
  getMediaPath,
  storeMediaSource,
} from "@web-speed-hackathon-2026/server/src/utils/media_derivation";
import { mediaDerivationQueue } from "@web-speed-hackathon-2026/server/src/utils/media_derivation_queue";

const SOURCE_KIND = "movies";
const CANONICAL_EXT = "mp4";

export const movieRouter = Router();

movieRouter.post("/movies", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("video/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const movieId = uuidv4();
  const sourcePath = await storeMediaSource(SOURCE_KIND, movieId, type.ext, req.body);
  const canonicalPath = getMediaPath(SOURCE_KIND, movieId, CANONICAL_EXT);

  if (type.ext === CANONICAL_EXT) {
    await createCanonicalMedia(SOURCE_KIND, sourcePath, canonicalPath);
  } else {
    void mediaDerivationQueue.enqueue({
      key: `${SOURCE_KIND}:${movieId}:canonical`,
      run: async () => {
        await createCanonicalMedia(SOURCE_KIND, sourcePath, canonicalPath);
      },
    });
  }

  return res.status(200).type("application/json").send({ id: movieId });
});
