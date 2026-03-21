import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import {
  createCanonicalMedia,
  getMediaPath,
  storeMediaSource,
} from "@web-speed-hackathon-2026/server/src/utils/media_derivation";
import { mediaDerivationQueue } from "@web-speed-hackathon-2026/server/src/utils/media_derivation_queue";

const SOURCE_KIND = "images";
const CANONICAL_EXT = "jpg";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("image/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const imageId = uuidv4();
  const sourcePath = await storeMediaSource(SOURCE_KIND, imageId, type.ext, req.body);
  if (type.ext === CANONICAL_EXT) {
    await createCanonicalMedia(SOURCE_KIND, sourcePath, getMediaPath(SOURCE_KIND, imageId, CANONICAL_EXT));
  } else {
    void mediaDerivationQueue.enqueue({
      key: `${SOURCE_KIND}:${imageId}:canonical`,
      run: async () => {
        await createCanonicalMedia(
          SOURCE_KIND,
          sourcePath,
          getMediaPath(SOURCE_KIND, imageId, CANONICAL_EXT),
        );
      },
    });
  }

  return res.status(200).type("application/json").send({ id: imageId });
});
