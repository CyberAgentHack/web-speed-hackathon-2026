import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runFfmpeg } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";

interface SoundMetadata {
    artist?: string;
    title?: string;
}

export async function extractMetadataFromSound(
    data: Buffer,
): Promise<SoundMetadata> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "audio-metadata-"));
    const inputPath = path.join(tempDir, "input");
    const metadataPath = path.join(tempDir, "meta.txt");

    try {
        await fs.writeFile(inputPath, data);

        await runFfmpeg([
            "-y",
            "-i",
            inputPath,
            "-f",
            "ffmetadata",
            metadataPath,
        ]);

        const detectedEncoding = spawnSync("nkf", ["-g", metadataPath], {
            encoding: "utf8",
        });

        const encoding =
            detectedEncoding.status === 0 ? detectedEncoding.stdout.trim() : "";

        let metadataText: string;
        if (encoding.length > 0 && encoding.toUpperCase() !== "UTF-8") {
            const converted = spawnSync(
                "iconv",
                ["-f", encoding, "-t", "UTF-8", metadataPath],
                { encoding: "utf8" },
            );

            metadataText =
                converted.status === 0
                    ? converted.stdout
                    : await fs.readFile(metadataPath, "utf8");
        } else {
            metadataText = await fs.readFile(metadataPath, "utf8");
        }

        const lines = metadataText.split(/\r?\n/);

        const parseField = (key: string) => {
            const line = lines.find((value) =>
                value.toLowerCase().startsWith(`${key.toLowerCase()}=`),
            );
            if (line == null) {
                return undefined;
            }

            const value = line.slice(line.indexOf("=") + 1).trim();
            return value.length > 0 ? value : undefined;
        };

        return {
            artist: parseField("artist"),
            title: parseField("title"),
        };
    } catch {
        return {
            artist: undefined,
            title: undefined,
        };
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}
