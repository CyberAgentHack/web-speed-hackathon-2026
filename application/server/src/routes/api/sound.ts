import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { extractMetadataFromSound } from "@web-speed-hackathon-2026/server/src/utils/extract_metadata_from_sound";
import {
  createCanonicalMedia,
  createDerivativeMedia,
  getMediaPath,
  storeMediaSource,
} from "@web-speed-hackathon-2026/server/src/utils/media_derivation";
import { mediaDerivationQueue } from "@web-speed-hackathon-2026/server/src/utils/media_derivation_queue";

const SOURCE_KIND = "sounds";
const CANONICAL_EXT = "mp3";

export const soundRouter = Router();

soundRouter.post("/sounds", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  if (Buffer.isBuffer(req.body) === false) {
    throw new httpErrors.BadRequest();
  }

  const type = await fileTypeFromBuffer(req.body);
  if (type === undefined || type.mime.startsWith("audio/") === false) {
    throw new httpErrors.BadRequest("Invalid file type");
  }

  const soundId = uuidv4();
  const sourcePath = await storeMediaSource(SOURCE_KIND, soundId, type.ext, req.body);
  const { artist, title } = await extractMetadataFromSound(req.body);
  const canonicalPath = getMediaPath(SOURCE_KIND, soundId, CANONICAL_EXT);
  const derivativePath = getMediaPath(SOURCE_KIND, soundId, "ogg");
  const metadata = { artist, title };
  const enqueueDerivative = (): void => {
    void mediaDerivationQueue.enqueue({
      key: `${SOURCE_KIND}:${soundId}:derivative`,
      run: async () => {
        await createDerivativeMedia(SOURCE_KIND, sourcePath, derivativePath, metadata);
      },
    });
  };

  if (type.ext === CANONICAL_EXT) {
    await createCanonicalMedia(SOURCE_KIND, sourcePath, canonicalPath, metadata);
    enqueueDerivative();
  } else {
    void mediaDerivationQueue.enqueue({
      key: `${SOURCE_KIND}:${soundId}:canonical`,
      run: async () => {
        await createCanonicalMedia(
          SOURCE_KIND,
          sourcePath,
          canonicalPath,
          metadata,
        );
        enqueueDerivative();
      },
    });
  }

  return res.status(200).type("application/json").send({ artist, id: soundId, title });
});
