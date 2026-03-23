import fs from "node:fs/promises";
import path from "node:path";

import { PUBLIC_PATH } from "../src/paths.js";
import { copyMetadataWithExiftool } from "../src/utils/exiftool.js";
import { runFfmpeg } from "../src/utils/ffmpeg.js";

const doneFiles: string[] = [];

(async () => {
    const dir = path.resolve(PUBLIC_PATH, "./movies");

    const files = await fs.readdir(dir);

    console.log("Start convert files", files);
    for (const file of files) {
        if (path.extname(file) !== ".gif") continue;
        const name = path.basename(file, ".gif");
        if (doneFiles.includes(name)) continue;

        const newFile = `${name}.webm`;
        const sourcePath = path.resolve(dir, file);
        const outputPath = path.resolve(dir, `./${newFile}`);
        await runFfmpeg([
            "-y",
            "-i",
            sourcePath,
            "-movflags",
            "faststart",
            "-vf",
            "scale='min(iw,600)':-1",
            "-pix_fmt",
            "yuv420p",
            "-row-mt",
            "1",
            outputPath,
        ]);
        await copyMetadataWithExiftool(sourcePath, outputPath);
        console.log(`outputed: ${newFile}`);
    }
})();
