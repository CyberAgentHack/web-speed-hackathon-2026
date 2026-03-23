import { spawn } from "node:child_process";

const CANDIDATE_KEYS = [
    "ImageDescription",
    "description",
    "DESCRIPTION",
    "comment",
    "COMMENT",
    "title",
    "TITLE",
] as const;

export async function extractAltFromImage(
    filePath: string,
): Promise<string | undefined> {
    const output = await new Promise<string>((resolve, reject) => {
        const process = spawn("exiftool", [
            "-j",
            "-ImageDescription",
            "-Description",
            "-Comment",
            "-Title",
            filePath,
        ]);

        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });
        process.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        process.on("error", reject);
        process.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
                return;
            }

            reject(
                new Error(`exiftool failed with exit code ${code}: ${stderr}`),
            );
        });
    });

    const [metadata = {}] = JSON.parse(output) as Array<
        Record<string, unknown>
    >;

    for (const key of CANDIDATE_KEYS) {
        const value = metadata[key];
        if (typeof value === "string" && value.trim() !== "") {
            return value.trim();
        }
    }

    return undefined;
}
