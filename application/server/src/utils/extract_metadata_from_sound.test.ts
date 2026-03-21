import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { extractMetadataFromSound } from "./extract_metadata_from_sound";

test("extractMetadataFromSound decodes Shift_JIS WAV INFO metadata", async () => {
  const data = await fs.readFile(
    path.resolve(import.meta.dirname, "../../../../docs/assets/maoudamashii_shining_star.wav"),
  );

  const metadata = await extractMetadataFromSound(data);

  assert.deepEqual(metadata, {
    artist: "魔王魂",
    title: "シャイニングスター",
  });
});
